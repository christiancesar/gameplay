import type { StreamPreset } from '@gameplay/contracts'

import type { RealtimeService } from '@/modules/realtime/model/services/realtime.service'
import type { CallMedia } from '@/shared/media/call-media'
import type { ScreenCaptureHandle, ScreenCaptureResult } from '@/shared/media/screen-capture'

import { idleShare, type SharePriority, type ShareSettings, type ShareStateStore } from '../entities/share'
import { toOutboundSample, toViewerStat, type OutboundSample } from '../mappers/outbound-stats.mapper'
import { contentHintOf, displayMediaOptions, liveVideoConstraints, toPreset, videoEncoding } from '../rules/preset'

type ShareRealtime = Pick<RealtimeService, 'startStream' | 'stopStream' | 'on'>

type ShareSessionDeps = {
  realtime: ShareRealtime
  store: ShareStateStore
  /** The media of the voice call; screen share only exists inside it. */
  subscribeMedia: (handler: (media: CallMedia | null) => void) => () => void
  acquireScreen: (options: DisplayMediaStreamOptions) => Promise<ScreenCaptureResult>
  stopScreen: (capture: ScreenCaptureHandle) => void
  /** How often the viewers are measured. */
  pollMs?: number
}

const POLL_MS = 1000

/** One running share: the capture, who gets it, and what stops it. */
type Live = {
  media: CallMedia
  capture: ScreenCaptureHandle
  preset: StreamPreset
  priority: SharePriority
  samples: Map<string, OutboundSample>
  stops: (() => void)[]
  poll: ReturnType<typeof setInterval> | undefined
}

/**
 * The screen share of this tab, outside React like the call. Starting opens the browser's picker, then
 * tells the room. The video only goes to who asked to watch (`stream:watch-request`), one connection
 * each (mesh); each viewer is measured from the stats of its own sender.
 */
class ShareSession {
  private readonly deps: ShareSessionDeps
  private media: CallMedia | null = null
  private live: Live | null = null
  private stopMedia: (() => void) | undefined

  constructor(deps: ShareSessionDeps) {
    this.deps = deps
  }

  /** Follows the call. Safe to call again. */
  attach(): void {
    this.stopMedia?.()
    this.stopMedia = this.deps.subscribeMedia((media) => {
      this.media = media
      // The call ended or moved to another room: the share goes with it (the API clears the state itself).
      if (this.live && this.live.media.transport !== media?.transport) this.teardown({ announce: false })
    })
  }

  detach(): void {
    this.stopMedia?.()
    this.stopMedia = undefined
    this.media = null
    this.teardown({ announce: false })
  }

  /** Opens the picker and, if the user picks something, goes live. */
  async start(settings: ShareSettings, priority: SharePriority): Promise<void> {
    const { store } = this.deps
    if (store.getState().status !== 'idle') return
    const media = this.media
    if (!media) {
      store.setState({ notice: 'not-in-call' })
      return
    }
    store.setState({ status: 'picking', settings, priority, notice: null })

    const result = await this.deps.acquireScreen(displayMediaOptions(settings))
    if (!result.ok) {
      store.setState({ ...idleShare, settings, priority, notice: result.reason === 'cancelled' ? null : result.reason })
      return
    }
    const { capture } = result
    // The call ended while the picker was open.
    if (this.media !== media) {
      this.deps.stopScreen(capture)
      store.setState({ ...idleShare, settings, priority })
      return
    }

    const preset = toPreset(settings.resolution, settings.fps)
    capture.video.contentHint = contentHintOf(priority)
    // The browser's own "stop sharing" button ends the track.
    capture.video.onended = () => void this.stop()
    const captured = capture.video.getSettings?.()
    const live: Live = { media, capture, preset, priority, samples: new Map(), stops: [], poll: undefined }
    this.live = live
    live.stops.push(
      this.deps.realtime.on('stream:watch-request', ({ viewerId }) => void this.addViewer(live, viewerId)),
      this.deps.realtime.on('stream:unwatch', ({ viewerId }) => this.removeViewer(live, viewerId)),
      this.deps.realtime.on('room:participants', ({ roomId, participants }) => {
        if (roomId !== media.roomId) return
        const present = new Set(participants.map((participant) => participant.userId))
        for (const viewerId of this.deps.store.getState().viewerIds) {
          if (!present.has(viewerId)) this.removeViewer(live, viewerId)
        }
      }),
    )
    store.setState({
      status: 'live',
      source: captured?.height ? { height: captured.height, fps: captured.frameRate ?? settings.fps } : null,
    })
    try {
      await this.deps.realtime.startStream(preset)
    } catch {
      if (this.live === live) {
        this.teardown({ announce: false })
        store.setState({ notice: 'start-failed' })
      }
      return
    }
    if (this.live === live) live.poll = setInterval(() => void this.measure(live), this.deps.pollMs ?? POLL_MS)
  }

  /** Stops sharing, from the panel or because the browser's own button ended the track. */
  async stop(): Promise<void> {
    this.teardown({ announce: true })
  }

  /** Changes preset and/or priority of the running share. The capture and the connections stay up. */
  async updateQuality(settings: ShareSettings, priority: SharePriority): Promise<void> {
    const live = this.live
    if (!live) return
    const preset = toPreset(settings.resolution, settings.fps)
    live.priority = priority
    live.capture.video.contentHint = contentHintOf(priority)
    this.deps.store.setState({ settings, priority })
    await live.capture.video.applyConstraints(liveVideoConstraints(preset)).catch(() => undefined)
    if (this.live !== live) return
    const presetChanged = preset !== live.preset
    live.preset = preset
    await Promise.all(
      this.deps.store
        .getState()
        .viewerIds.map((viewerId) =>
          live.media.transport.setVideoEncoding(viewerId, live.capture.video, videoEncoding(preset, priority)),
        ),
    )
    if (presetChanged) this.deps.realtime.startStream(preset).catch(() => undefined)
  }

  dismissNotice(): void {
    this.deps.store.setState({ notice: null })
  }

  private async addViewer(live: Live, viewerId: string) {
    if (this.live !== live) return
    const { store } = this.deps
    const { transport } = live.media
    const { video, audio, stream } = live.capture
    if (!store.getState().viewerIds.includes(viewerId)) {
      store.setState({ viewerIds: [...store.getState().viewerIds, viewerId] })
    }
    transport.addTrack(viewerId, video, stream)
    if (audio) transport.addTrack(viewerId, audio, stream)
    await transport.setVideoEncoding(viewerId, video, videoEncoding(live.preset, live.priority))
  }

  private removeViewer(live: Live, viewerId: string) {
    if (this.live !== live) return
    const { store } = this.deps
    if (!store.getState().viewerIds.includes(viewerId)) return
    live.media.transport.removeTrack(viewerId, live.capture.video)
    if (live.capture.audio) live.media.transport.removeTrack(viewerId, live.capture.audio)
    live.samples.delete(viewerId)
    const { [viewerId]: _gone, ...stats } = store.getState().stats
    store.setState({ viewerIds: store.getState().viewerIds.filter((id) => id !== viewerId), stats })
  }

  private async measure(live: Live) {
    const viewerIds = [...this.deps.store.getState().viewerIds]
    const results = await Promise.all(
      viewerIds.map(async (viewerId) => {
        const sample = toOutboundSample(await live.media.transport.getSenderStats(viewerId, live.capture.video))
        if (!sample) return [viewerId, null] as const
        const stat = toViewerStat(sample, live.samples.get(viewerId))
        live.samples.set(viewerId, sample)
        return [viewerId, stat] as const
      }),
    )
    if (this.live !== live) return
    const { store } = this.deps
    const stats = { ...store.getState().stats }
    for (const [viewerId, stat] of results) {
      if (stat && store.getState().viewerIds.includes(viewerId)) stats[viewerId] = stat
    }
    store.setState({ stats })
  }

  private teardown({ announce }: { announce: boolean }) {
    const live = this.live
    if (!live) return
    this.live = null
    clearInterval(live.poll)
    for (const stop of live.stops) stop()
    live.capture.video.onended = null
    for (const viewerId of this.deps.store.getState().viewerIds) {
      live.media.transport.removeTrack(viewerId, live.capture.video)
      if (live.capture.audio) live.media.transport.removeTrack(viewerId, live.capture.audio)
    }
    this.deps.stopScreen(live.capture)
    const { settings, priority } = this.deps.store.getState()
    this.deps.store.setState({ ...idleShare, settings, priority })
    if (announce) this.deps.realtime.stopStream().catch(() => undefined)
  }
}

export { POLL_MS, ShareSession }
export type { ShareRealtime, ShareSessionDeps }

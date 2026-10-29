import type { StreamMode, StreamPreset, StreamQualityLevel } from '@gameplay/contracts'

import type { RealtimeService } from '@/modules/realtime/model/services/realtime.service'
import type { CallMedia } from '@/shared/media/call-media'
import type { RtpSenderLike } from '@/shared/media/browser-media'
import type { StatsRecord } from '@/shared/media/media-transport'
import type { ScreenCaptureHandle, ScreenCaptureResult } from '@/shared/media/screen-capture'
import type { OutgoingTrack } from '@/shared/media/sfu-connection'
import { SpeakingDetector } from '@/shared/media/speaking-detector'

import {
  idleShare,
  type SharePriority,
  type ShareSettings,
  type ShareSource,
  type ShareStateStore,
  type ShareSurface,
} from '../entities/share'
import { toOutboundSample, toUplinkSample, toViewerStat, type OutboundSample } from '../mappers/outbound-stats.mapper'
import { toSurface } from '../rules/surface'
import { logScreenShareDebug, videoEncodingStats } from './screen-share-debug'
import {
  contentHintOf,
  displayMediaOptions,
  liveVideoConstraints,
  simulcastEncodings,
  toPreset,
  videoEncoding,
  viewerEncoding,
} from '../rules/preset'

type ShareRealtime = Pick<RealtimeService, 'startStream' | 'stopStream' | 'on'>

/** The screen on the SFU: sent once, whatever the number of viewers. */
type SfuPublication = {
  senderOf(track: MediaStreamTrack): RtpSenderLike | undefined
  getStats(): Promise<{ forEach(callback: (stats: StatsRecord) => void): void }>
  close(): void
}

/** How to send the share: through the SFU or straight to each viewer, and whether Direct may stand in. */
type ShareStartMode = { mode: StreamMode; fallbackToMesh: boolean }

/** What the browser gave when a share started, for the reports. */
type ShareStartReport = {
  source: ShareSource
  surface: ShareSurface
  audioRequested: boolean
  audioReceived: boolean
}

type ShareSessionDeps = {
  realtime: ShareRealtime
  store: ShareStateStore
  /** The media of the voice call; screen share only exists inside it. */
  subscribeMedia: (handler: (media: CallMedia | null) => void) => () => void
  /** `sourceId`: the screen or window the user picked in the dialog (hosts that list them); null: the host's picker. */
  acquireScreen: (
    options: DisplayMediaStreamOptions,
    audioApps: readonly string[],
    sourceId: string | null,
  ) => Promise<ScreenCaptureResult>
  stopScreen: (capture: ScreenCaptureHandle) => void
  publishToSfu: (tracks: OutgoingTrack[]) => Promise<SfuPublication>
  /** How often the viewers are measured. */
  pollMs?: number
  /** Told once per share that goes live. */
  report?: (start: ShareStartReport) => void
}

const POLL_MS = 1000
/** Game audio is quieter than a voice in front of the microphone, and has longer pauses. */
const AUDIO_THRESHOLD = 0.005
const AUDIO_HOLD_MS = 2000
const AUDIO_POLL_MS = 250

/** One running share: the capture, who gets it, and what stops it. */
type Live = {
  media: CallMedia
  capture: ScreenCaptureHandle
  preset: StreamPreset
  priority: SharePriority
  samples: Map<string, OutboundSample>
  stops: (() => void)[]
  poll: ReturnType<typeof setInterval> | undefined
  /** Reads whether the captured audio has sound; missing without an audio track. */
  audioLevel: SpeakingDetector | undefined
  mode: StreamMode
  /** The screen on the SFU; null in Mesh. */
  sfu: SfuPublication | null
  uplink: OutboundSample | undefined
  lastDebugStatsAt: number
  /** What each Direct viewer asked for; missing is Auto. */
  levels: Map<string, StreamQualityLevel>
}

/**
 * The screen share of this tab, outside React like the call. Starting opens the browser's picker, then
 * tells the room. Through the SFU the screen goes up once, with simulcast layers, and each viewer pulls it;
 * Direct (Mesh) sends it only to who asked to watch (`stream:watch-request`), one connection each, and each
 * viewer is measured from the stats of its own sender.
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

  /**
   * Opens the picker and, if the user picks something, goes live. With a `sourceId` the user already picked in the
   * dialog, the host captures that and opens no picker.
   */
  async start(
    settings: ShareSettings,
    priority: SharePriority,
    { mode, fallbackToMesh }: ShareStartMode = { mode: 'mesh', fallbackToMesh: false },
    sourceId: string | null = null,
  ): Promise<void> {
    const { store } = this.deps
    if (store.getState().status !== 'idle') return
    const media = this.media
    if (!media) {
      store.setState({ notice: 'not-in-call' })
      return
    }
    store.setState({ status: 'picking', settings, priority, notice: null })

    const result = await this.deps.acquireScreen(
      displayMediaOptions(settings),
      settings.includeAudio ? settings.audioApps : [],
      sourceId,
    )
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

    const preset = toPreset(settings.resolution, settings.fps, settings.aspectRatio)
    capture.video.contentHint = contentHintOf(priority)
    // The browser's own "stop sharing" button ends the track.
    capture.video.onended = () => void this.stop()
    const captured = capture.video.getSettings?.()
    const live: Live = {
      media,
      capture,
      preset,
      priority,
      samples: new Map(),
      stops: [],
      poll: undefined,
      audioLevel: undefined,
      mode,
      sfu: null,
      uplink: undefined,
      lastDebugStatsAt: 0,
      levels: new Map(),
    }
    this.live = live
    live.stops.push(
      this.deps.realtime.on('stream:watch-request', ({ viewerId }) => void this.addViewer(live, viewerId)),
      this.deps.realtime.on('stream:unwatch', ({ viewerId }) => this.removeViewer(live, viewerId)),
      // A Direct viewer wants less (or Auto again): only their connection changes.
      this.deps.realtime.on('stream:quality', ({ viewerId, level }) => {
        if (this.live !== live || live.sfu) return
        live.levels.set(viewerId, level)
        if (!this.deps.store.getState().viewerIds.includes(viewerId)) return
        void live.media.transport.setVideoEncoding(viewerId, live.capture.video, this.encodingFor(live, viewerId))
      }),
      // Through the SFU, each viewer tells what reaches them.
      this.deps.realtime.on('stream:received', ({ viewerId, quality }) => {
        if (this.live !== live || !live.sfu) return
        logScreenShareDebug('viewer-received-quality', { quality })
        const { stats, viewerIds } = this.deps.store.getState()
        if (!viewerIds.includes(viewerId)) return
        this.deps.store.setState({ stats: { ...stats, [viewerId]: { ...quality, limitation: 'none' } } })
      }),
      // The platform admin turned this mode off: the API already stopped the share.
      this.deps.realtime.on('stream:ended', () => {
        if (this.live !== live) return
        this.teardown({ announce: false })
        this.deps.store.setState({ notice: 'disabled' })
      }),
      this.deps.realtime.on('room:participants', ({ roomId, participants }) => {
        if (roomId !== media.roomId) return
        const present = new Set(participants.map((participant) => participant.userId))
        for (const viewerId of this.deps.store.getState().viewerIds) {
          if (!present.has(viewerId)) this.removeViewer(live, viewerId)
        }
      }),
    )
    const surface = toSurface(captured?.displaySurface)
    logScreenShareDebug('capture-started', {
      target: { preset, priority, source: settings.source },
      constraints: capture.video.getConstraints?.(),
      actual: capture.video.getSettings(),
      readyState: capture.video.readyState,
    })
    // Browsers without screen audio (Firefox, Safari) or a source without it give no track and no error.
    const missingAudio = settings.includeAudio && !capture.audio
    let frameRateCapability: MediaTrackCapabilities['frameRate'] | undefined
    try {
      frameRateCapability = capture.video.getCapabilities?.().frameRate
    } catch {
      frameRateCapability = undefined
    }
    const maxFps =
      typeof frameRateCapability === 'object' && frameRateCapability && 'max' in frameRateCapability
        ? (frameRateCapability.max ?? null)
        : null
    store.setState({
      status: 'live',
      source:
        captured?.width && captured.height
          ? { width: captured.width, height: captured.height, fps: captured.frameRate ?? settings.fps, maxFps }
          : null,
      preview: { stream: capture.stream, surface },
      audio: capture.audio ? 'silent' : missingAudio ? 'missing' : 'off',
      notice: missingAudio ? 'no-audio' : null,
    })
    if (capture.audio) live.audioLevel = this.watchAudioLevel(live)
    if (mode === 'sfu' && !(await this.publish(live, fallbackToMesh))) return
    if (this.live !== live) return
    store.setState({ mode: live.mode })
    this.deps.report?.({
      source: settings.source,
      surface,
      audioRequested: settings.includeAudio,
      audioReceived: capture.audio !== null,
    })
    try {
      await this.deps.realtime.startStream(preset, live.mode)
    } catch {
      if (this.live === live) {
        this.teardown({ announce: false })
        store.setState({ notice: 'start-failed' })
      }
      return
    }
    if (this.live === live) live.poll = setInterval(() => void this.measure(live), this.deps.pollMs ?? POLL_MS)
  }

  /** Puts the screen on the SFU. False when the share could not go on (it was torn down). */
  private async publish(live: Live, fallbackToMesh: boolean): Promise<boolean> {
    const { video, audio, stream } = live.capture
    const tracks: OutgoingTrack[] = [
      { track: video, stream, kind: 'video', encodings: simulcastEncodings(live.preset) },
      ...(audio ? [{ track: audio, stream, kind: 'audio' as const }] : []),
    ]
    try {
      const sfu = await this.deps.publishToSfu(tracks)
      if (this.live !== live) {
        sfu.close()
        return false
      }
      live.sfu = sfu
      await this.applySfuEncoding(live)
      return true
    } catch {
      if (this.live !== live) return false
      if (!fallbackToMesh) {
        this.teardown({ announce: false })
        this.deps.store.setState({ notice: 'start-failed' })
        return false
      }
      // Same capture, no new picker: the share goes Direct.
      live.mode = 'mesh'
      this.deps.store.setState({ notice: 'fell-back' })
      return true
    }
  }

  /** Simulcast layers of the preset, with the priority's degradation, on the SFU sender. */
  private async applySfuEncoding(live: Live) {
    const sender = live.sfu?.senderOf(live.capture.video)
    if (!sender) return
    const parameters = sender.getParameters()
    const layers = simulcastEncodings(live.preset)
    parameters.encodings = parameters.encodings.map((encoding) => ({
      ...encoding,
      ...layers.find((layer) => layer.rid === encoding.rid),
    }))
    const { degradationPreference } = videoEncoding(live.preset, live.priority)
    const encodings = parameters.encodings.map((encoding) => ({
      rid: encoding.rid,
      scaleResolutionDownBy: encoding.scaleResolutionDownBy,
      maxBitrate: encoding.maxBitrate,
      maxFramerate: encoding.maxFramerate,
      active: encoding.active,
    }))
    try {
      await sender.setParameters({ ...parameters, degradationPreference } as RTCRtpSendParameters)
      logScreenShareDebug('sfu-encoding-applied', { preset: live.preset, degradationPreference, encodings })
    } catch (error) {
      logScreenShareDebug('sfu-encoding-failed', {
        preset: live.preset,
        degradationPreference,
        encodings,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      })
    }
  }

  /** Stops sharing, from the panel or because the browser's own button ended the track. */
  async stop(): Promise<void> {
    this.teardown({ announce: true })
  }

  /** Changes preset and/or priority of the running share. The capture and the connections stay up. */
  async updateQuality(settings: ShareSettings, priority: SharePriority): Promise<void> {
    const live = this.live
    if (!live) return
    const preset = toPreset(settings.resolution, settings.fps, settings.aspectRatio)
    live.priority = priority
    live.capture.video.contentHint = contentHintOf(priority)
    this.deps.store.setState({ settings, priority })
    const constraints = liveVideoConstraints(preset)
    let constraintError: { name: string; message: string } | undefined
    try {
      await live.capture.video.applyConstraints(constraints)
    } catch (error) {
      constraintError = {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
      }
    }
    logScreenShareDebug('quality-change', {
      target: { preset, priority },
      constraints,
      applied: !constraintError,
      error: constraintError,
      actual: live.capture.video.getSettings(),
    })
    if (this.live !== live) return
    const presetChanged = JSON.stringify(preset) !== JSON.stringify(live.preset)
    live.preset = preset
    const actual = live.capture.video.getSettings()
    const previousSource = this.deps.store.getState().source
    if (actual.width && actual.height) {
      this.deps.store.setState({
        source: {
          width: actual.width,
          height: actual.height,
          fps: actual.frameRate ?? settings.fps,
          maxFps: previousSource?.maxFps ?? null,
        },
      })
    }
    if (live.sfu) await this.applySfuEncoding(live)
    else
      await Promise.all(
        this.deps.store
          .getState()
          .viewerIds.map((viewerId) =>
            live.media.transport.setVideoEncoding(viewerId, live.capture.video, this.encodingFor(live, viewerId)),
          ),
      )
    if (presetChanged) this.deps.realtime.startStream(preset, live.mode).catch(() => undefined)
  }

  dismissNotice(): void {
    this.deps.store.setState({ notice: null })
  }

  private watchAudioLevel(live: Live): SpeakingDetector {
    const detector = new SpeakingDetector({
      createMeter: (stream) => live.media.audio.createMeter(stream),
      onChange: (loud) => {
        if (this.live === live) this.deps.store.setState({ audio: loud.length > 0 ? 'active' : 'silent' })
      },
      threshold: AUDIO_THRESHOLD,
      holdMs: AUDIO_HOLD_MS,
      intervalMs: AUDIO_POLL_MS,
    })
    detector.watch('screen', live.capture.stream)
    return detector
  }

  private async addViewer(live: Live, viewerId: string) {
    if (this.live !== live) return
    const { store } = this.deps
    const { transport } = live.media
    const { video, audio, stream } = live.capture
    if (!store.getState().viewerIds.includes(viewerId)) {
      store.setState({ viewerIds: [...store.getState().viewerIds, viewerId] })
    }
    // Through the SFU the viewer pulls the screen; the request only lists them.
    if (live.sfu) return
    transport.addTrack(viewerId, video, stream)
    if (audio) transport.addTrack(viewerId, audio, stream)
    await transport.setVideoEncoding(viewerId, video, this.encodingFor(live, viewerId))
  }

  private encodingFor(live: Live, viewerId: string) {
    return viewerEncoding(live.preset, live.priority, live.levels.get(viewerId) ?? 'auto')
  }

  private removeViewer(live: Live, viewerId: string) {
    if (this.live !== live) return
    const { store } = this.deps
    if (!store.getState().viewerIds.includes(viewerId)) return
    if (!live.sfu) {
      live.media.transport.removeTrack(viewerId, live.capture.video)
      if (live.capture.audio) live.media.transport.removeTrack(viewerId, live.capture.audio)
    }
    live.samples.delete(viewerId)
    live.levels.delete(viewerId)
    const { [viewerId]: _gone, ...stats } = store.getState().stats
    store.setState({ viewerIds: store.getState().viewerIds.filter((id) => id !== viewerId), stats })
  }

  private async measure(live: Live) {
    if (live.sfu) return this.measureUplink(live, live.sfu)
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
    const now = Date.now()
    if (now - live.lastDebugStatsAt >= 5000) {
      live.lastDebugStatsAt = now
      logScreenShareDebug('mesh-outbound-stats', {
        actual: live.capture.video.getSettings(),
        viewers: results.map(([, stat]) => stat),
      })
    }
    if (this.live !== live) return
    const { store } = this.deps
    const stats = { ...store.getState().stats }
    for (const [viewerId, stat] of results) {
      if (stat && store.getState().viewerIds.includes(viewerId)) stats[viewerId] = stat
    }
    store.setState({ stats })
  }

  /** Through the SFU only the upload is known here; each viewer's quality is measured on their side. */
  private async measureUplink(live: Live, sfu: SfuPublication) {
    const records: StatsRecord[] = []
    ;(await sfu.getStats()).forEach((record) => records.push(record))
    const now = Date.now()
    if (now - live.lastDebugStatsAt >= 5000) {
      live.lastDebugStatsAt = now
      logScreenShareDebug('sfu-uplink-stats', {
        preset: live.preset,
        actual: live.capture.video.getSettings(),
        encodings: videoEncodingStats(records),
      })
    }
    const sample = toUplinkSample(records)
    if (this.live !== live || !sample) return
    const uplink = toViewerStat(sample, live.uplink)
    live.uplink = sample
    if (uplink) this.deps.store.setState({ uplink })
  }

  private teardown({ announce }: { announce: boolean }) {
    const live = this.live
    if (!live) return
    this.live = null
    clearInterval(live.poll)
    live.audioLevel?.dispose()
    for (const stop of live.stops) stop()
    live.capture.video.onended = null
    live.sfu?.close()
    for (const viewerId of live.sfu ? [] : this.deps.store.getState().viewerIds) {
      live.media.transport.removeTrack(viewerId, live.capture.video)
      if (live.capture.audio) live.media.transport.removeTrack(viewerId, live.capture.audio)
    }
    this.deps.stopScreen(live.capture)
    const { settings, priority } = this.deps.store.getState()
    this.deps.store.setState({ ...idleShare, settings, priority })
    if (announce) this.deps.realtime.stopStream().catch(() => undefined)
  }
}

export { AUDIO_HOLD_MS, AUDIO_POLL_MS, POLL_MS, ShareSession }
export type { SfuPublication, ShareRealtime, ShareSessionDeps, ShareStartMode, ShareStartReport }

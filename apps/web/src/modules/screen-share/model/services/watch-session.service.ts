import type { SfuLayer, StreamMode } from '@gameplay/contracts'

import type { RealtimeService } from '@/modules/realtime/model/services/realtime.service'
import type { MediaStreamFactory, TrackEventLike } from '@/shared/media/browser-media'
import type { CallMedia } from '@/shared/media/call-media'
import type { StatsRecord } from '@/shared/media/media-transport'

import { idleWatch, type WatchStateStore } from '../entities/watch'
import { type InboundSample, toInboundSample, toReceivedQuality } from '../mappers/inbound-stats.mapper'
import { screenAudioKey, toScreenGain } from '../rules/screen-audio'

type WatchRealtime = Pick<RealtimeService, 'watchStream' | 'unwatchStream' | 'on'>

type WatchSessionDeps = {
  realtime: WatchRealtime
  store: WatchStateStore
  subscribeMedia: (handler: (media: CallMedia | null) => void) => () => void
  /** How the streamer sends their screen, from the room's roster. */
  streamModeOf: (userId: string) => StreamMode | null
  watchFromSfu: (
    streamerId: string,
    layer: SfuLayer,
    onTrack: (event: TrackEventLike) => void,
  ) => Promise<SfuSubscription>
  createMediaStream: MediaStreamFactory
  /** How often what reaches me is measured. */
  pollMs?: number
}

/** Someone's screen received from the SFU. */
type SfuSubscription = {
  getStats(): Promise<{ forEach(callback: (stats: StatsRecord) => void): void }>
  close(): void
}

const POLL_MS = 1000

/** The video being measured: its track, the last sample and the timer. */
type Measuring = { trackId: string; previous: InboundSample | undefined; timer: ReturnType<typeof setInterval> }

/** Everything tied to the media of one call, released when the call goes. */
type Bound = {
  media: CallMedia
  stops: (() => void)[]
  streamerDown: boolean
  measuring: Measuring | null
  /** The screen watched through the SFU; null in Mesh. */
  sfu: SfuSubscription | null
}

/**
 * Watching one screen at a time. A Direct (Mesh) stream costs the streamer one encode per viewer and nothing
 * is received before `watch`: the streamer only adds the video to the connection after the request. Through
 * the SFU the screen comes on a connection of its own; the request still goes out, so the streamer sees
 * who watches.
 */
class WatchSession {
  private readonly deps: WatchSessionDeps
  private bound: Bound | null = null
  private stopMedia: (() => void) | undefined

  constructor(deps: WatchSessionDeps) {
    this.deps = deps
  }

  attach(): void {
    this.stopMedia?.()
    this.stopMedia = this.deps.subscribeMedia((media) => this.bind(media))
  }

  detach(): void {
    this.stopMedia?.()
    this.stopMedia = undefined
    this.bind(null)
  }

  /** Asks `streamerId` for their screen, leaving the one watched now. */
  watch(streamerId: string): void {
    const { store, realtime } = this.deps
    const bound = this.bound
    if (!bound) return
    const current = store.getState().streamerId
    if (current === streamerId) return
    if (current) this.release(bound, { announce: true })
    store.setState({ streamerId, status: 'waiting', stream: null, failed: false })
    if (this.deps.streamModeOf(streamerId) === 'sfu') void this.watchSfu(bound, streamerId)
    realtime.watchStream(streamerId).catch(() => {
      if (store.getState().streamerId !== streamerId) return
      this.release(bound, { announce: false })
      store.setState({ failed: true })
    })
  }

  /** Stops watching and closes the view. */
  stop(): void {
    if (this.bound) this.release(this.bound, { announce: true })
    else this.deps.store.setState({ ...idleWatch, volume: this.deps.store.getState().volume })
  }

  setVolume(volume: number): void {
    const { store } = this.deps
    const clamped = Math.min(100, Math.max(0, volume))
    store.setState({ volume: clamped })
    const streamerId = store.getState().streamerId
    if (streamerId) this.bound?.media.audio.setVolume(screenAudioKey(streamerId), toScreenGain(clamped))
  }

  dismissFailure(): void {
    this.deps.store.setState({ failed: false })
  }

  private bind(media: CallMedia | null) {
    const previous = this.bound
    if (previous && previous.media.transport === media?.transport) return
    if (previous) {
      this.release(previous, { announce: false })
      for (const stop of previous.stops) stop()
    }
    this.bound = null
    if (!media) return

    const bound: Bound = { media, stops: [], streamerDown: false, measuring: null, sfu: null }
    this.bound = bound
    bound.stops.push(
      media.transport.onRemoteTrack((peerId, track, stream, source) =>
        this.onTrack(bound, peerId, track, stream, source),
      ),
      media.transport.onPeerStatus((peerId, status) => this.onPeerStatus(bound, peerId, status)),
      this.deps.realtime.on('room:participants', ({ roomId, participants }) => {
        const streamerId = this.deps.store.getState().streamerId
        if (!streamerId || roomId !== media.roomId) return
        // The streamer stopped or left: the view closes. Unwatching after the end is accepted by the API.
        if (!participants.some((participant) => participant.userId === streamerId && participant.streaming !== null)) {
          this.release(bound, { announce: true })
        }
      }),
    )
  }

  private async watchSfu(bound: Bound, streamerId: string) {
    const { store } = this.deps
    const current = () => this.bound === bound && store.getState().streamerId === streamerId
    try {
      const sfu = await this.deps.watchFromSfu(streamerId, 'f', ({ track, streams }) => {
        if (!current()) return
        this.onTrack(bound, streamerId, track, streams[0] ?? this.deps.createMediaStream([track]), 'screen')
      })
      if (!current()) {
        sfu.close()
        return
      }
      bound.sfu = sfu
    } catch {
      if (!current()) return
      this.release(bound, { announce: true })
      store.setState({ failed: true })
    }
  }

  private onTrack(bound: Bound, peerId: string, track: MediaStreamTrack, stream: MediaStream, source: string) {
    const { store } = this.deps
    if (source !== 'screen' || store.getState().streamerId !== peerId) return
    if (track.kind === 'video') {
      store.setState({ stream, status: 'playing', quality: null, hasAudio: stream.getAudioTracks().length > 0 })
      this.measure(bound, peerId, track.id)
      return
    }
    store.setState({ hasAudio: true })
    const key = screenAudioKey(peerId)
    bound.media.audio.setVolume(key, toScreenGain(store.getState().volume))
    bound.media.audio.addStream(key, stream)
  }

  /** Reads what reaches me from the stats of the connection with the streamer, once per `pollMs`. */
  private measure(bound: Bound, streamerId: string, trackId: string) {
    this.stopMeasuring(bound)
    const measuring: Measuring = {
      trackId,
      previous: undefined,
      timer: setInterval(async () => {
        const sample = toInboundSample(await this.statsOf(bound, streamerId), trackId)
        if (bound.measuring !== measuring || !sample) return
        const quality = toReceivedQuality(sample, measuring.previous)
        measuring.previous = sample
        if (quality) this.deps.store.setState({ quality })
      }, this.deps.pollMs ?? POLL_MS),
    }
    bound.measuring = measuring
  }

  /** The SFU connection when watching through it, else the call's connection with the streamer. */
  private async statsOf(bound: Bound, streamerId: string): Promise<StatsRecord[]> {
    if (!bound.sfu) return bound.media.transport.getConnectionStats(streamerId)
    const records: StatsRecord[] = []
    ;(await bound.sfu.getStats()).forEach((record) => records.push(record))
    return records
  }

  private stopMeasuring(bound: Bound) {
    if (bound.measuring) clearInterval(bound.measuring.timer)
    bound.measuring = null
  }

  /** The streamer's connection was rebuilt after a drop: the new one does not carry the video, ask again. */
  private onPeerStatus(bound: Bound, peerId: string, status: 'connecting' | 'connected' | 'failed') {
    const { store, realtime } = this.deps
    if (store.getState().streamerId !== peerId) return
    if (status !== 'connected') {
      bound.streamerDown = true
      return
    }
    if (!bound.streamerDown) return
    bound.streamerDown = false
    realtime.watchStream(peerId).catch(() => undefined)
  }

  private release(bound: Bound, { announce }: { announce: boolean }) {
    const { store, realtime } = this.deps
    const { streamerId, volume } = store.getState()
    if (streamerId) {
      bound.media.audio.removeStream(screenAudioKey(streamerId))
      if (announce) realtime.unwatchStream(streamerId).catch(() => undefined)
    }
    bound.streamerDown = false
    bound.sfu?.close()
    bound.sfu = null
    this.stopMeasuring(bound)
    store.setState({ ...idleWatch, volume })
  }
}

export { POLL_MS, WatchSession }
export type { SfuSubscription, WatchRealtime, WatchSessionDeps }

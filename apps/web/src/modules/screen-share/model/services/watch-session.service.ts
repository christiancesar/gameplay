import type { RealtimeService } from '@/modules/realtime/model/services/realtime.service'
import type { CallMedia } from '@/shared/media/call-media'

import { idleWatch, type WatchStateStore } from '../entities/watch'
import { screenAudioKey, toScreenGain } from '../rules/screen-audio'

type WatchRealtime = Pick<RealtimeService, 'watchStream' | 'unwatchStream' | 'on'>

type WatchSessionDeps = {
  realtime: WatchRealtime
  store: WatchStateStore
  subscribeMedia: (handler: (media: CallMedia | null) => void) => () => void
}

/** Everything tied to the media of one call, released when the call goes. */
type Bound = { media: CallMedia; stops: (() => void)[]; streamerDown: boolean }

/**
 * Watching one screen at a time (a stream costs the streamer one encode per viewer). Nothing is received
 * before `watch`: the streamer only adds the video to the connection after the request.
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

    const bound: Bound = { media, stops: [], streamerDown: false }
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

  private onTrack(bound: Bound, peerId: string, track: MediaStreamTrack, stream: MediaStream, source: string) {
    const { store } = this.deps
    if (source !== 'screen' || store.getState().streamerId !== peerId) return
    if (track.kind === 'video') {
      store.setState({ stream, status: 'playing' })
      return
    }
    const key = screenAudioKey(peerId)
    bound.media.audio.setVolume(key, toScreenGain(store.getState().volume))
    bound.media.audio.addStream(key, stream)
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
    store.setState({ ...idleWatch, volume })
  }
}

export { WatchSession }
export type { WatchRealtime, WatchSessionDeps }

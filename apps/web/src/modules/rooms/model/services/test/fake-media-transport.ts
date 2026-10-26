import type { IceServer } from '@gameplay/contracts'
import { vi } from 'vitest'

import type { MediaTransport, PeerStatus, StatsRecord, TrackSource } from '@/shared/media/media-transport'

class FakeMediaTransport implements MediaTransport {
  readonly peers = new Set<string>()
  readonly addPeer = vi.fn((peerId: string) => void this.peers.add(peerId))
  readonly removePeer = vi.fn((peerId: string) => void this.peers.delete(peerId))
  readonly retryPeer = vi.fn()
  readonly setVoiceTrack = vi.fn(async () => undefined)
  readonly addTrack = vi.fn()
  readonly removeTrack = vi.fn()
  readonly setVideoEncoding = vi.fn(async () => undefined)
  /** What `getSenderStats` answers, per `peerId`. */
  stats: Record<string, StatsRecord[]> = {}
  readonly getSenderStats = vi.fn(async (peerId: string) => this.stats[peerId] ?? [])
  /** What `getConnectionStats` answers, per `peerId`. */
  connectionStats: Record<string, StatsRecord[]> = {}
  readonly getConnectionStats = vi.fn(async (peerId: string) => this.connectionStats[peerId] ?? [])
  peerIds = () => [...this.peers]
  readonly updateIceServers = vi.fn((_iceServers: IceServer[]) => undefined)
  readonly close = vi.fn()
  private statusHandler: ((peerId: string, status: PeerStatus) => void) | undefined
  private trackHandler:
    | ((peerId: string, track: MediaStreamTrack, stream: MediaStream, source: TrackSource) => void)
    | undefined

  onPeerStatus(handler: (peerId: string, status: PeerStatus) => void) {
    this.statusHandler = handler
    return () => {
      this.statusHandler = undefined
    }
  }

  onRemoteTrack(handler: (peerId: string, track: MediaStreamTrack, stream: MediaStream, source: TrackSource) => void) {
    this.trackHandler = handler
    return () => {
      this.trackHandler = undefined
    }
  }

  emitStatus(peerId: string, status: PeerStatus) {
    this.statusHandler?.(peerId, status)
  }

  emitTrack(peerId: string, track: MediaStreamTrack, stream: MediaStream, source: TrackSource = 'voice') {
    this.trackHandler?.(peerId, track, stream, source)
  }
}

export { FakeMediaTransport }

import type { IceServer } from '@gameplay/contracts'
import { vi } from 'vitest'

import type { MediaTransport, PeerStatus } from '@/shared/media/media-transport'

class FakeMediaTransport implements MediaTransport {
  readonly peers = new Set<string>()
  readonly addPeer = vi.fn((peerId: string) => void this.peers.add(peerId))
  readonly removePeer = vi.fn((peerId: string) => void this.peers.delete(peerId))
  readonly retryPeer = vi.fn()
  readonly setVoiceTrack = vi.fn(async () => undefined)
  readonly addTrack = vi.fn()
  readonly removeTrack = vi.fn()
  readonly updateIceServers = vi.fn((_iceServers: IceServer[]) => undefined)
  readonly close = vi.fn()
  private statusHandler: ((peerId: string, status: PeerStatus) => void) | undefined
  private trackHandler: ((peerId: string, track: MediaStreamTrack, stream: MediaStream) => void) | undefined

  onPeerStatus(handler: (peerId: string, status: PeerStatus) => void) {
    this.statusHandler = handler
    return () => {
      this.statusHandler = undefined
    }
  }

  onRemoteTrack(handler: (peerId: string, track: MediaStreamTrack, stream: MediaStream) => void) {
    this.trackHandler = handler
    return () => {
      this.trackHandler = undefined
    }
  }

  emitStatus(peerId: string, status: PeerStatus) {
    this.statusHandler?.(peerId, status)
  }

  emitTrack(peerId: string, track: MediaStreamTrack, stream: MediaStream) {
    this.trackHandler?.(peerId, track, stream)
  }
}

export { FakeMediaTransport }

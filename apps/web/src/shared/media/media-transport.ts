import type { IceServer, SignalSend } from '@gameplay/contracts'

/** Where one remote peer is, as far as the media path goes. Drives the tile in the room stage. */
type PeerStatus = 'connecting' | 'connected' | 'failed'

/** Signaling relayed by the API between people in the same room. `data` is opaque to the API. */
type SignalKind = SignalSend['kind']

type SignalingChannel = {
  send(to: string, kind: SignalKind, data: unknown): Promise<void>
  /** Returns the function that stops listening. */
  onSignal(handler: (from: string, kind: SignalKind, data: unknown) => void): () => void
}

type PeerStatusHandler = (peerId: string, status: PeerStatus) => void
type RemoteTrackHandler = (peerId: string, track: MediaStreamTrack, stream: MediaStream) => void

/**
 * What the app needs from a way of moving media between people in a room. `MeshTransport` opens one
 * peer connection per person; an SFU transport can replace it without touching ViewModels or Views.
 */
type MediaTransport = {
  /** Starts (idempotent) the connection with someone who is in the room. */
  addPeer(peerId: string): void
  /** Closes the connection with someone who left. */
  removePeer(peerId: string): void
  /** Asks for another attempt on a connection that failed. */
  retryPeer(peerId: string): void
  /** The microphone track sent to everyone, or null to send nothing (listen only). */
  setVoiceTrack(track: MediaStreamTrack | null): Promise<void>
  /** Sends one more track (screen share) to one peer. Renegotiates the connection. */
  addTrack(peerId: string, track: MediaStreamTrack, stream: MediaStream): void
  removeTrack(peerId: string, track: MediaStreamTrack): void
  /** New credentials (TURN) for connections that exist and for the ones to come. */
  updateIceServers(iceServers: IceServer[]): void
  onPeerStatus(handler: PeerStatusHandler): () => void
  onRemoteTrack(handler: RemoteTrackHandler): () => void
  /** Closes every connection and stops listening to the signaling. */
  close(): void
}

export type { MediaTransport, PeerStatus, PeerStatusHandler, RemoteTrackHandler, SignalKind, SignalingChannel }

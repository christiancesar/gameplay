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
/** `voice` is the microphone of the peer; `screen` is a track of their screen share (video, and audio if shared). */
type TrackSource = 'voice' | 'screen'
type RemoteTrackHandler = (peerId: string, track: MediaStreamTrack, stream: MediaStream, source: TrackSource) => void

/** What the encoder of a screen track is told. Applied through `RTCRtpSender.setParameters`. */
type VideoEncoding = {
  maxBitrate: number
  maxFramerate: number
  degradationPreference: 'maintain-framerate' | 'maintain-resolution' | 'balanced'
}

/** One entry of `getStats()`, as a plain object. */
type StatsRecord = Record<string, unknown>

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
  /** Sets bitrate, frame rate and degradation of a video track already sent to the peer. No renegotiation. */
  setVideoEncoding(peerId: string, track: MediaStreamTrack, encoding: VideoEncoding): Promise<void>
  /** `getStats()` of the connection that sends the track to the peer; empty when it is not sent. */
  getSenderStats(peerId: string, track: MediaStreamTrack): Promise<StatsRecord[]>
  /** People with a connection, in any state. */
  peerIds(): string[]
  /** `getStats()` of the whole connection with the peer (call quality); empty without one. */
  getConnectionStats(peerId: string): Promise<StatsRecord[]>
  /** New credentials (TURN) for connections that exist and for the ones to come. */
  updateIceServers(iceServers: IceServer[]): void
  onPeerStatus(handler: PeerStatusHandler): () => void
  onRemoteTrack(handler: RemoteTrackHandler): () => void
  /** Closes every connection and stops listening to the signaling. */
  close(): void
}

export type {
  MediaTransport,
  PeerStatus,
  PeerStatusHandler,
  RemoteTrackHandler,
  SignalKind,
  SignalingChannel,
  StatsRecord,
  TrackSource,
  VideoEncoding,
}

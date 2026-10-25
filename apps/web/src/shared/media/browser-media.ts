/**
 * The slice of the browser WebRTC API the transport uses. The real objects and the test fakes both fit
 * it, so specs never touch `RTCPeerConnection`.
 */
type IceCandidateLike = RTCIceCandidateInit & { toJSON?: () => RTCIceCandidateInit }

type RtpSenderLike = {
  readonly track: MediaStreamTrack | null
  replaceTrack(track: MediaStreamTrack | null): Promise<void>
}

type RtpTransceiverLike = {
  direction: RTCRtpTransceiverDirection
  readonly sender: RtpSenderLike
}

type PeerConnectionLike = {
  readonly signalingState: RTCSignalingState
  readonly connectionState: RTCPeerConnectionState
  readonly localDescription: { type: RTCSdpType; sdp: string } | null
  onnegotiationneeded: (() => void) | null
  onicecandidate: ((event: { candidate: IceCandidateLike | null }) => void) | null
  ontrack: ((event: { track: MediaStreamTrack; streams: readonly MediaStream[] }) => void) | null
  onconnectionstatechange: (() => void) | null
  setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void>
  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>
  addTransceiver(kind: 'audio' | 'video', init?: RTCRtpTransceiverInit): RtpTransceiverLike
  getTransceivers(): RtpTransceiverLike[]
  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RtpSenderLike
  removeTrack(sender: RtpSenderLike): void
  restartIce(): void
  setConfiguration(configuration: RTCConfiguration): void
  close(): void
}

type PeerConnectionFactory = (configuration: RTCConfiguration) => PeerConnectionLike
type MediaStreamFactory = (tracks: MediaStreamTrack[]) => MediaStream

const createBrowserPeerConnection: PeerConnectionFactory = (configuration) =>
  new RTCPeerConnection(configuration) as unknown as PeerConnectionLike

const createBrowserMediaStream: MediaStreamFactory = (tracks) => new MediaStream(tracks)

export { createBrowserMediaStream, createBrowserPeerConnection }
export type {
  IceCandidateLike,
  MediaStreamFactory,
  PeerConnectionFactory,
  PeerConnectionLike,
  RtpSenderLike,
  RtpTransceiverLike,
}

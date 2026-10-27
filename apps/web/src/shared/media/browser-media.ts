/**
 * The slice of the browser WebRTC API the transport uses. The real objects and the test fakes both fit
 * it, so specs never touch `RTCPeerConnection`.
 */
type IceCandidateLike = RTCIceCandidateInit & { toJSON?: () => RTCIceCandidateInit }

type RtpSenderLike = {
  readonly track: MediaStreamTrack | null
  replaceTrack(track: MediaStreamTrack | null): Promise<void>
  getParameters(): RTCRtpSendParameters
  setParameters(parameters: RTCRtpSendParameters): Promise<void>
  getStats(): Promise<{ forEach(callback: (stats: Record<string, unknown>) => void): void }>
}

type RtpTransceiverLike = {
  direction: RTCRtpTransceiverDirection
  readonly sender: RtpSenderLike
  /** Set once a description is applied; the SFU names tracks by it. */
  readonly mid?: string | null
}

type TrackEventLike = {
  track: MediaStreamTrack
  streams: readonly MediaStream[]
  /** Which transceiver brought the track: the first one carries voice. Missing in fakes that do not care. */
  transceiver?: RtpTransceiverLike
}

type PeerConnectionLike = {
  readonly signalingState: RTCSignalingState
  readonly connectionState: RTCPeerConnectionState
  readonly localDescription: { type: RTCSdpType; sdp: string } | null
  readonly iceGatheringState: RTCIceGatheringState
  onicegatheringstatechange: (() => void) | null
  onnegotiationneeded: (() => void) | null
  onicecandidate: ((event: { candidate: IceCandidateLike | null }) => void) | null
  ontrack: ((event: TrackEventLike) => void) | null
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
  getStats(): Promise<{ forEach(callback: (stats: Record<string, unknown>) => void): void }>
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
  TrackEventLike,
}

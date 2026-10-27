import { vi } from 'vitest'

import type {
  IceCandidateLike,
  PeerConnectionLike,
  RtpSenderLike,
  RtpTransceiverLike,
  TrackEventLike,
} from '../browser-media'

class FakeSender implements RtpSenderLike {
  track: MediaStreamTrack | null = null
  readonly replaceTrack = vi.fn(async (track: MediaStreamTrack | null) => {
    this.track = track
  })
  /** What `setParameters` last received. */
  parameters: RTCRtpSendParameters = { encodings: [], transactionId: 't', codecs: [], headerExtensions: [], rtcp: {} }
  readonly getParameters = vi.fn(() => structuredClone(this.parameters))
  readonly setParameters = vi.fn(async (parameters: RTCRtpSendParameters) => {
    this.parameters = parameters
  })
  /** Entries `getStats()` yields. */
  stats: Record<string, unknown>[] = []
  readonly getStats = vi.fn(async () => ({
    forEach: (callback: (stats: Record<string, unknown>) => void) => this.stats.forEach(callback),
  }))
}

/** In-memory RTCPeerConnection. Specs drive it with `fire*` and read what the transport asked of it. */
class FakePeerConnection implements PeerConnectionLike {
  signalingState: RTCSignalingState = 'stable'
  connectionState: RTCPeerConnectionState = 'new'
  localDescription: { type: RTCSdpType; sdp: string } | null = null
  /** Candidates are gathered at once unless a spec sets 'gathering'. */
  iceGatheringState: RTCIceGatheringState = 'complete'
  onicegatheringstatechange: (() => void) | null = null
  onnegotiationneeded: (() => void) | null = null
  onicecandidate: ((event: { candidate: IceCandidateLike | null }) => void) | null = null
  ontrack: ((event: TrackEventLike) => void) | null = null
  onconnectionstatechange: (() => void) | null = null

  readonly configuration: RTCConfiguration
  readonly remoteDescriptions: RTCSessionDescriptionInit[] = []
  readonly candidates: RTCIceCandidateInit[] = []
  readonly transceivers: RtpTransceiverLike[] = []
  readonly senders: FakeSender[] = []
  /** Entries the connection's `getStats()` yields. */
  stats: Record<string, unknown>[] = []
  readonly getStats = vi.fn(async () => ({
    forEach: (callback: (stats: Record<string, unknown>) => void) => this.stats.forEach(callback),
  }))
  closed = false
  private offers = 0

  readonly restartIce = vi.fn(() => this.onnegotiationneeded?.())
  readonly setConfiguration = vi.fn()
  readonly removeTrack = vi.fn()

  constructor(configuration: RTCConfiguration) {
    this.configuration = configuration
  }

  async setLocalDescription() {
    this.assignMids()
    if (this.signalingState === 'have-remote-offer') {
      this.localDescription = { type: 'answer', sdp: 'answer-sdp' }
      this.signalingState = 'stable'
      return
    }
    this.offers += 1
    this.localDescription = { type: 'offer', sdp: `offer-sdp-${this.offers}` }
    this.signalingState = 'have-local-offer'
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    // Setting a remote offer while holding a local one rolls the local one back.
    this.remoteDescriptions.push(description)
    if (description.type === 'offer') this.adoptRemoteTransceiver()
    this.signalingState = description.type === 'offer' ? 'have-remote-offer' : 'stable'
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.remoteDescriptions.length === 0) throw new Error('no remote description')
    this.candidates.push(candidate)
  }

  addTransceiver(_kind?: 'audio' | 'video', init?: RTCRtpTransceiverInit) {
    const sender = new FakeSender()
    if (init?.sendEncodings) sender.parameters.encodings = init.sendEncodings
    const transceiver: RtpTransceiverLike & { mid: string | null } = {
      direction: init?.direction ?? 'sendrecv',
      sender,
      mid: null,
    }
    this.senders.push(sender)
    this.transceivers.push(transceiver)
    return transceiver
  }

  getTransceivers() {
    return this.transceivers
  }

  /** What the browser does when it applies a remote offer: a receive only transceiver appears. */
  private adoptRemoteTransceiver() {
    if (this.transceivers.length > 0) return
    const transceiver = { direction: 'recvonly' as RTCRtpTransceiverDirection, sender: new FakeSender() }
    this.senders.push(transceiver.sender)
    this.transceivers.push(transceiver)
  }

  addTrack(track: MediaStreamTrack) {
    const sender = new FakeSender()
    sender.track = track
    this.senders.push(sender)
    this.onnegotiationneeded?.()
    return sender
  }

  /** Like the browser: a transceiver gets its mid when a description first includes it. */
  private assignMids() {
    this.transceivers.forEach((transceiver, index) => {
      const withMid = transceiver as RtpTransceiverLike & { mid?: string | null }
      withMid.mid ??= String(index)
    })
  }

  finishGathering() {
    this.iceGatheringState = 'complete'
    this.onicegatheringstatechange?.()
  }

  close() {
    this.closed = true
    this.connectionState = 'closed'
  }

  setConnectionState(state: RTCPeerConnectionState) {
    this.connectionState = state
    this.onconnectionstatechange?.()
  }

  fireCandidate(candidate: RTCIceCandidateInit) {
    this.onicecandidate?.({ candidate })
  }

  fireTrack(track: MediaStreamTrack, streams: readonly MediaStream[] = [], transceiver?: RtpTransceiverLike) {
    this.ontrack?.({ track, streams, transceiver })
  }
}

export { FakePeerConnection, FakeSender }

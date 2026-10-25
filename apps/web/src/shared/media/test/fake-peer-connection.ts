import { vi } from 'vitest'

import type { IceCandidateLike, PeerConnectionLike, RtpSenderLike, RtpTransceiverLike } from '../browser-media'

class FakeSender implements RtpSenderLike {
  track: MediaStreamTrack | null = null
  readonly replaceTrack = vi.fn(async (track: MediaStreamTrack | null) => {
    this.track = track
  })
}

/** In-memory RTCPeerConnection. Specs drive it with `fire*` and read what the transport asked of it. */
class FakePeerConnection implements PeerConnectionLike {
  signalingState: RTCSignalingState = 'stable'
  connectionState: RTCPeerConnectionState = 'new'
  localDescription: { type: RTCSdpType; sdp: string } | null = null
  onnegotiationneeded: (() => void) | null = null
  onicecandidate: ((event: { candidate: IceCandidateLike | null }) => void) | null = null
  ontrack: ((event: { track: MediaStreamTrack; streams: readonly MediaStream[] }) => void) | null = null
  onconnectionstatechange: (() => void) | null = null

  readonly configuration: RTCConfiguration
  readonly remoteDescriptions: RTCSessionDescriptionInit[] = []
  readonly candidates: RTCIceCandidateInit[] = []
  readonly transceivers: RtpTransceiverLike[] = []
  readonly senders: FakeSender[] = []
  closed = false
  private offers = 0

  readonly restartIce = vi.fn(() => this.onnegotiationneeded?.())
  readonly setConfiguration = vi.fn()
  readonly removeTrack = vi.fn()

  constructor(configuration: RTCConfiguration) {
    this.configuration = configuration
  }

  async setLocalDescription() {
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

  addTransceiver() {
    const transceiver = { direction: 'sendrecv' as RTCRtpTransceiverDirection, sender: new FakeSender() }
    this.senders.push(transceiver.sender)
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

  fireTrack(track: MediaStreamTrack, streams: readonly MediaStream[] = []) {
    this.ontrack?.({ track, streams })
  }
}

export { FakePeerConnection, FakeSender }

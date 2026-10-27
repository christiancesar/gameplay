import type { IceServer } from '@gameplay/contracts'

import type {
  IceCandidateLike,
  MediaStreamFactory,
  PeerConnectionFactory,
  PeerConnectionLike,
  RtpSenderLike,
  RtpTransceiverLike,
} from './browser-media'
import type {
  MediaTransport,
  PeerStatus,
  PeerStatusHandler,
  RemoteTrackHandler,
  SignalKind,
  SignalingChannel,
  StatsRecord,
  TrackSource,
  VideoEncoding,
} from './media-transport'
import { parseSignalPayload } from './signal-payload'

/** A connection that has not reached `connected` after this long is reported as failed, so it is retried. */
const CONNECT_TIMEOUT_MS = 15_000

type MeshTransportOptions = {
  /** Id of the local user: decides who is polite when both sides offer at once. */
  selfId: string
  signaling: SignalingChannel
  iceServers: IceServer[]
  createPeerConnection: PeerConnectionFactory
  createMediaStream: MediaStreamFactory
  /** Overridable for specs. */
  createEpoch?: () => string
  connectTimeoutMs?: number
}

type Peer = {
  id: string
  pc: PeerConnectionLike
  /** Identifies this connection to the other side. */
  epoch: string
  remoteEpoch: string | null
  /** The one who gives way when both offer at the same time (perfect negotiation). */
  polite: boolean
  makingOffer: boolean
  ignoreOffer: boolean
  /** The audio transceiver. The polite side has none until the first offer brings one. */
  voice: RtpTransceiverLike | null
  senders: Map<MediaStreamTrack, RtpSenderLike>
  /** Screen tracks asked before the voice transceiver exists: adding them first would take its place. */
  pending: Map<MediaStreamTrack, MediaStream>
  /** What each video sender must be told, kept to apply again once the connection is negotiated. */
  encodings: Map<MediaStreamTrack, VideoEncoding>
  status: PeerStatus
  /** Last status sent to the handlers, so each change is reported once. */
  reported: PeerStatus | null
  /** Signals of one peer run one after the other: a candidate must wait for the description before it. */
  queue: Promise<void>
  connectTimer: ReturnType<typeof setTimeout> | undefined
}

const defaultEpoch = () => crypto.randomUUID()

function describe(pc: PeerConnectionLike) {
  const description = pc.localDescription
  return description ? { type: description.type, sdp: description.sdp } : null
}

/**
 * Voice and screen over one RTCPeerConnection per remote person (mesh). The API only relays the
 * signaling. Offers use perfect negotiation, so any side can renegotiate at any time (a screen share
 * starting) and simultaneous offers resolve without a coordinator.
 */
class MeshTransport implements MediaTransport {
  private readonly options: MeshTransportOptions
  private readonly peers = new Map<string, Peer>()
  private readonly statusHandlers = new Set<PeerStatusHandler>()
  private readonly trackHandlers = new Set<RemoteTrackHandler>()
  private readonly stopSignaling: () => void
  private iceServers: IceServer[]
  private voiceTrack: MediaStreamTrack | null = null
  private closed = false

  constructor(options: MeshTransportOptions) {
    this.options = options
    this.iceServers = options.iceServers
    this.stopSignaling = options.signaling.onSignal((from, kind, data) => this.receive(from, kind, data))
  }

  addPeer(peerId: string): void {
    if (this.closed || this.peers.has(peerId)) return
    this.createPeer(peerId)
  }

  removePeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (!peer) return
    this.destroyPeer(peer)
  }

  retryPeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (!peer || peer.status === 'connected') return
    this.setStatus(peer, 'connecting')
    this.armConnectTimer(peer)
    // Fires negotiationneeded; the next offer carries new ICE credentials.
    peer.pc.restartIce()
  }

  async setVoiceTrack(track: MediaStreamTrack | null): Promise<void> {
    this.voiceTrack = track
    await Promise.all(
      [...this.peers.values()].map((peer) => peer.voice?.sender.replaceTrack(track).catch(() => undefined)),
    )
  }

  addTrack(peerId: string, track: MediaStreamTrack, stream: MediaStream): void {
    const peer = this.peers.get(peerId)
    if (!peer || peer.senders.has(track)) return
    if (!peer.voice) {
      peer.pending.set(track, stream)
      return
    }
    peer.senders.set(track, peer.pc.addTrack(track, stream))
  }

  removeTrack(peerId: string, track: MediaStreamTrack): void {
    const peer = this.peers.get(peerId)
    if (!peer) return
    peer.pending.delete(track)
    peer.encodings.delete(track)
    const sender = peer.senders.get(track)
    if (!sender) return
    peer.senders.delete(track)
    peer.pc.removeTrack(sender)
  }

  async setVideoEncoding(peerId: string, track: MediaStreamTrack, encoding: VideoEncoding): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer) return
    peer.encodings.set(track, encoding)
    await this.applyEncoding(peer, track)
  }

  async getSenderStats(peerId: string, track: MediaStreamTrack): Promise<StatsRecord[]> {
    const sender = this.peers.get(peerId)?.senders.get(track)
    if (!sender) return []
    try {
      const records: StatsRecord[] = []
      const report = await sender.getStats()
      report.forEach((entry) => records.push(entry))
      return records
    } catch {
      return []
    }
  }

  peerIds(): string[] {
    return [...this.peers.keys()]
  }

  async getConnectionStats(peerId: string): Promise<StatsRecord[]> {
    const pc = this.peers.get(peerId)?.pc
    if (!pc) return []
    try {
      const records: StatsRecord[] = []
      const report = await pc.getStats()
      report.forEach((entry) => records.push(entry))
      return records
    } catch {
      return []
    }
  }

  updateIceServers(iceServers: IceServer[]): void {
    this.iceServers = iceServers
    for (const peer of this.peers.values()) {
      try {
        peer.pc.setConfiguration({ iceServers })
      } catch {
        // A connection that is closing refuses new configuration; it does not need it.
      }
    }
  }

  onPeerStatus(handler: PeerStatusHandler): () => void {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  onRemoteTrack(handler: RemoteTrackHandler): () => void {
    this.trackHandlers.add(handler)
    return () => this.trackHandlers.delete(handler)
  }

  close(): void {
    this.closed = true
    this.stopSignaling()
    for (const peer of [...this.peers.values()]) this.destroyPeer(peer)
    this.statusHandlers.clear()
    this.trackHandlers.clear()
  }

  private createPeer(peerId: string): Peer {
    const { selfId, createPeerConnection, createEpoch = defaultEpoch } = this.options
    const pc = createPeerConnection({ iceServers: this.iceServers })
    const peer: Peer = {
      id: peerId,
      pc,
      epoch: createEpoch(),
      remoteEpoch: null,
      polite: selfId > peerId,
      makingOffer: false,
      ignoreOffer: false,
      voice: null,
      senders: new Map(),
      pending: new Map(),
      encodings: new Map(),
      status: 'connecting',
      reported: null,
      queue: Promise.resolve(),
      connectTimer: undefined,
    }
    this.peers.set(peerId, peer)

    // Handlers first: adding the transceiver schedules negotiationneeded.
    pc.onnegotiationneeded = () => void this.offer(peer)
    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return
      this.send(peer, 'candidate', { candidate: this.candidateInit(candidate) })
    }
    pc.ontrack = ({ track, streams, transceiver }) => {
      if (this.peers.get(peerId) !== peer) return
      const stream = streams[0] ?? this.options.createMediaStream([track])
      const source = this.sourceOf(peer, track, transceiver)
      for (const handler of this.trackHandlers) handler(peerId, track, stream, source)
    }
    pc.onconnectionstatechange = () => this.onConnectionState(peer)

    // Only one side makes the first offer (the lower id), so both do not offer at once and end up with
    // two audio transceivers. The other side adopts the transceiver that comes with that offer.
    // One audio transceiver always exists, so a listen-only person still receives voice.
    if (!peer.polite) {
      peer.voice = pc.addTransceiver('audio', { direction: 'sendrecv' })
      if (this.voiceTrack) void peer.voice.sender.replaceTrack(this.voiceTrack).catch(() => undefined)
    }

    this.setStatus(peer, 'connecting')
    this.armConnectTimer(peer)
    return peer
  }

  private destroyPeer(peer: Peer) {
    clearTimeout(peer.connectTimer)
    peer.pc.onnegotiationneeded = null
    peer.pc.onicecandidate = null
    peer.pc.ontrack = null
    peer.pc.onconnectionstatechange = null
    peer.pc.close()
    if (this.peers.get(peer.id) === peer) this.peers.delete(peer.id)
  }

  /** The first transceiver of a connection carries voice; anything else is a screen share. */
  private sourceOf(peer: Peer, track: MediaStreamTrack, transceiver: RtpTransceiverLike | undefined): TrackSource {
    if (track.kind === 'video') return 'screen'
    if (!transceiver) return 'voice'
    return peer.pc.getTransceivers()[0] === transceiver ? 'voice' : 'screen'
  }

  private async applyEncoding(peer: Peer, track: MediaStreamTrack) {
    const sender = peer.senders.get(track)
    const encoding = peer.encodings.get(track)
    if (!sender || !encoding) return
    try {
      const parameters = sender.getParameters()
      if (!parameters.encodings || parameters.encodings.length === 0) parameters.encodings = [{}]
      parameters.encodings[0].maxBitrate = encoding.maxBitrate
      parameters.encodings[0].maxFramerate = encoding.maxFramerate
      parameters.encodings[0].scaleResolutionDownBy = encoding.scaleResolutionDownBy ?? 1
      ;(parameters as { degradationPreference?: string }).degradationPreference = encoding.degradationPreference
      await sender.setParameters(parameters)
    } catch {
      // Not negotiated yet or the connection is closing: it is applied again after the answer.
    }
  }

  private candidateInit(candidate: IceCandidateLike): RTCIceCandidateInit {
    return candidate.toJSON ? candidate.toJSON() : candidate
  }

  private async offer(peer: Peer) {
    try {
      peer.makingOffer = true
      await peer.pc.setLocalDescription()
      const description = describe(peer.pc)
      if (description) this.send(peer, 'offer', { description })
    } catch {
      this.setStatus(peer, 'failed')
    } finally {
      peer.makingOffer = false
    }
  }

  private send(peer: Peer, kind: SignalKind, payload: object) {
    // Refused when the other person already left the room: the roster update removes the peer.
    this.options.signaling.send(peer.id, kind, { epoch: peer.epoch, ...payload }).catch(() => undefined)
  }

  private receive(from: string, kind: SignalKind, data: unknown) {
    if (this.closed) return
    const payload = parseSignalPayload(kind, data)
    if (!payload) return

    let peer = this.peers.get(from)
    // The other side rebuilt its connection (new page, or it dropped us and added us again): start over.
    if (peer?.remoteEpoch && peer.remoteEpoch !== payload.epoch) {
      this.destroyPeer(peer)
      peer = undefined
    }
    // Someone offering before the roster told us about them (or a stale candidate: ignored).
    if (!peer) {
      if (kind !== 'offer') return
      peer = this.createPeer(from)
    }
    peer.remoteEpoch = payload.epoch

    const target = peer
    target.queue = target.queue.then(() => this.apply(target, kind, payload)).catch(() => undefined)
  }

  private async apply(peer: Peer, kind: SignalKind, payload: ReturnType<typeof parseSignalPayload>) {
    if (!payload || this.peers.get(peer.id) !== peer) return
    const { pc } = peer

    if ('description' in payload) {
      const { description } = payload
      const collision = kind === 'offer' && (peer.makingOffer || pc.signalingState !== 'stable')
      peer.ignoreOffer = !peer.polite && collision
      if (peer.ignoreOffer) return
      // The polite side rolls back its own offer implicitly when setting the remote one.
      await pc.setRemoteDescription(description)
      if (kind === 'offer') {
        await this.adoptVoice(peer)
        await pc.setLocalDescription()
        const answer = describe(pc)
        if (answer) this.send(peer, 'answer', { description: answer })
      } else {
        await Promise.all([...peer.encodings.keys()].map((track) => this.applyEncoding(peer, track)))
      }
      return
    }

    try {
      await pc.addIceCandidate(payload.candidate)
    } catch (error) {
      // Candidates of an offer we ignored are expected to fail.
      if (!peer.ignoreOffer) throw error
    }
  }

  /** The audio transceiver created by the remote offer becomes ours: it also sends our microphone. */
  private async adoptVoice(peer: Peer) {
    if (peer.voice) return
    const [transceiver] = peer.pc.getTransceivers()
    if (!transceiver) return
    peer.voice = transceiver
    transceiver.direction = 'sendrecv'
    await transceiver.sender.replaceTrack(this.voiceTrack).catch(() => undefined)
    for (const [track, stream] of peer.pending) peer.senders.set(track, peer.pc.addTrack(track, stream))
    peer.pending.clear()
  }

  private onConnectionState(peer: Peer) {
    switch (peer.pc.connectionState) {
      case 'connected':
        clearTimeout(peer.connectTimer)
        this.setStatus(peer, 'connected')
        break
      case 'failed':
        clearTimeout(peer.connectTimer)
        this.setStatus(peer, 'failed')
        break
      case 'new':
      case 'connecting':
      case 'disconnected':
        if (peer.status !== 'connecting') this.armConnectTimer(peer)
        this.setStatus(peer, 'connecting')
        break
      case 'closed':
        break
    }
  }

  private armConnectTimer(peer: Peer) {
    clearTimeout(peer.connectTimer)
    peer.connectTimer = setTimeout(() => {
      if (peer.status !== 'connected') this.setStatus(peer, 'failed')
    }, this.options.connectTimeoutMs ?? CONNECT_TIMEOUT_MS)
  }

  private setStatus(peer: Peer, status: PeerStatus) {
    if (this.peers.get(peer.id) !== peer) return
    peer.status = status
    if (peer.reported === status) return
    peer.reported = status
    for (const handler of this.statusHandlers) handler(peer.id, status)
  }
}

export { CONNECT_TIMEOUT_MS, MeshTransport }
export type { MeshTransportOptions }

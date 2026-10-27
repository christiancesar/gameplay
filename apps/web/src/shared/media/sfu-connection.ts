import type { SessionDescription, SfuLayer, SfuTrack, SfuTrackKind, SfuTracksResponse } from '@gameplay/contracts'

import type { PeerConnectionFactory, PeerConnectionLike, RtpSenderLike, TrackEventLike } from './browser-media'

/** The API calls behind `/api/media/sfu`; the browser never talks to Cloudflare's API itself. */
type SfuSignaling = {
  createSession(): Promise<string>
  publish(sessionId: string, offer: SessionDescription, tracks: SfuTrack[]): Promise<SfuTracksResponse>
  watch(sessionId: string, streamerId: string, layer: SfuLayer): Promise<SfuTracksResponse>
  renegotiate(sessionId: string, answer: SessionDescription): Promise<void>
  close(sessionId: string, mids: string[]): Promise<void>
}

type SfuConnectionDeps = {
  signaling: SfuSignaling
  createPeerConnection: PeerConnectionFactory
  iceServers: RTCIceServer[]
  /** How long to wait for ICE candidates before sending the description anyway. */
  gatherTimeoutMs?: number
}

type OutgoingTrack = {
  track: MediaStreamTrack
  stream: MediaStream
  kind: SfuTrackKind
  /** Simulcast layers of the video (`rid` f, h, q). */
  encodings?: RTCRtpEncodingParameters[]
}

const GATHER_TIMEOUT_MS = 2000

/** Cloudflare's SFU answers the description once; trickled candidates are not used. */
function gathered(pc: PeerConnectionLike, timeoutMs: number): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs)
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState !== 'complete') return
      clearTimeout(timer)
      resolve()
    }
  })
}

function localDescriptionOf(pc: PeerConnectionLike): SessionDescription {
  const description = pc.localDescription
  if (!description || (description.type !== 'offer' && description.type !== 'answer')) {
    throw new Error('No local description')
  }
  return { type: description.type, sdp: description.sdp }
}

/**
 * One connection to the Cloudflare Realtime SFU, negotiated through the API: either the streamer sending
 * their screen once (`publish`), or a viewer receiving someone's screen (`watch`).
 */
class SfuConnection {
  private closed = false
  private readonly pc: PeerConnectionLike
  private readonly signaling: SfuSignaling
  readonly sessionId: string
  private readonly mids: string[]
  private readonly senders: Map<MediaStreamTrack, RtpSenderLike>

  private constructor(
    pc: PeerConnectionLike,
    signaling: SfuSignaling,
    sessionId: string,
    mids: string[],
    senders: Map<MediaStreamTrack, RtpSenderLike>,
  ) {
    this.pc = pc
    this.signaling = signaling
    this.sessionId = sessionId
    this.mids = mids
    this.senders = senders
  }

  static async publish(deps: SfuConnectionDeps, tracks: OutgoingTrack[]): Promise<SfuConnection> {
    const pc = deps.createPeerConnection({ iceServers: deps.iceServers, bundlePolicy: 'max-bundle' })
    try {
      const transceivers = tracks.map(({ track, stream, kind, encodings }) => {
        const transceiver = pc.addTransceiver(kind, {
          direction: 'sendonly',
          streams: [stream],
          sendEncodings: encodings,
        })
        void transceiver.sender.replaceTrack(track)
        return transceiver
      })
      const sessionId = await deps.signaling.createSession()
      await pc.setLocalDescription()
      await gathered(pc, deps.gatherTimeoutMs ?? GATHER_TIMEOUT_MS)
      const sent = transceivers.map((transceiver, index) => ({ mid: transceiver.mid ?? '', kind: tracks[index].kind }))
      const response = await deps.signaling.publish(sessionId, localDescriptionOf(pc), sent)
      if (!response.sessionDescription) throw new Error('The SFU sent no answer')
      await pc.setRemoteDescription(response.sessionDescription)
      const senders = new Map(tracks.map(({ track }, index) => [track, transceivers[index].sender]))
      return new SfuConnection(
        pc,
        deps.signaling,
        sessionId,
        sent.map((track) => track.mid),
        senders,
      )
    } catch (error) {
      pc.close()
      throw error
    }
  }

  static async watch(
    deps: SfuConnectionDeps,
    streamerId: string,
    layer: SfuLayer,
    onTrack: (event: TrackEventLike) => void,
  ): Promise<SfuConnection> {
    const pc = deps.createPeerConnection({ iceServers: deps.iceServers, bundlePolicy: 'max-bundle' })
    pc.ontrack = onTrack
    try {
      const sessionId = await deps.signaling.createSession()
      const response = await deps.signaling.watch(sessionId, streamerId, layer)
      if (!response.sessionDescription) throw new Error('The SFU sent no offer')
      await pc.setRemoteDescription(response.sessionDescription)
      await pc.setLocalDescription()
      await gathered(pc, deps.gatherTimeoutMs ?? GATHER_TIMEOUT_MS)
      if (response.requiresImmediateRenegotiation) {
        await deps.signaling.renegotiate(sessionId, localDescriptionOf(pc))
      }
      return new SfuConnection(
        pc,
        deps.signaling,
        sessionId,
        response.tracks.map((track) => track.mid),
        new Map(),
      )
    } catch (error) {
      pc.close()
      throw error
    }
  }

  /** The sender of a published track, to change its encodings. */
  senderOf(track: MediaStreamTrack): RtpSenderLike | undefined {
    return this.senders.get(track)
  }

  getStats(): ReturnType<PeerConnectionLike['getStats']> {
    return this.pc.getStats()
  }

  /** Closes the connection and tells the SFU right away (otherwise it drops the tracks after 30 s). */
  close(): void {
    if (this.closed) return
    this.closed = true
    this.pc.close()
    this.signaling.close(this.sessionId, this.mids).catch(() => undefined)
  }
}

export { SfuConnection }
export type { OutgoingTrack, SfuConnectionDeps, SfuSignaling }

import type { SessionDescription, SfuLayer } from '@gameplay/contracts'

// A track to send, by the mid of its transceiver in the browser offer.
export type LocalTrack = { mid: string; trackName: string }

// A track to receive: someone else's published track.
export type RemoteTrack = { sessionId: string; trackName: string; layer?: SfuLayer }

export type Negotiation = {
  sessionDescription: SessionDescription | null
  requiresImmediateRenegotiation: boolean
  // The mid each track got in this session.
  tracks: { mid: string; trackName: string }[]
}

// Media server that relays the screen share (SFU), picked by its credentials
// in the env. Secrets stay on the API; the browser only sees SDP.
export abstract class SfuProvider {
  // False when the env has no credentials; every call then fails.
  abstract readonly configured: boolean
  // Who runs it (cloudflare); null when nobody is set up.
  abstract readonly name: string | null
  abstract newSession(): Promise<string>
  abstract publish(sessionId: string, offer: SessionDescription, tracks: LocalTrack[]): Promise<Negotiation>
  abstract pull(sessionId: string, tracks: RemoteTrack[]): Promise<Negotiation>
  abstract renegotiate(sessionId: string, answer: SessionDescription): Promise<void>
  // Switches the simulcast layer of a track already pulled at this mid.
  abstract setLayer(sessionId: string, mid: string, track: RemoteTrack & { layer: SfuLayer }): Promise<void>
  // With an offer the browser renegotiates and gets the answer back; without
  // it the tracks are closed right away.
  abstract close(sessionId: string, mids: string[], offer?: SessionDescription): Promise<SessionDescription | null>
}

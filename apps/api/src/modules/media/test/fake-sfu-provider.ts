import type { SessionDescription, SfuLayer } from '@gameplay/contracts'
import { SfuFailedError } from '../errors/media.errors'
import { type LocalTrack, type Negotiation, type RemoteTrack, SfuProvider } from '../sfu.provider'

type Call =
  | { op: 'publish'; sessionId: string; tracks: LocalTrack[] }
  | { op: 'pull'; sessionId: string; tracks: RemoteTrack[] }
  | { op: 'renegotiate'; sessionId: string }
  | { op: 'setLayer'; sessionId: string; mid: string; track: RemoteTrack & { layer: SfuLayer } }
  | { op: 'close'; sessionId: string; mids: string[]; negotiated: boolean }

// Hands out session ids s1, s2... and receiving mids r1, r2... Answers every
// publish and offers on every pull, as Cloudflare does. `failing` makes the
// next calls throw.
export class FakeSfuProvider extends SfuProvider {
  configured = true
  failing = false
  readonly calls: Call[] = []
  private sessions = 0
  private mids = 0

  async newSession(): Promise<string> {
    this.check()
    return `s${++this.sessions}`
  }

  async publish(sessionId: string, _offer: SessionDescription, tracks: LocalTrack[]): Promise<Negotiation> {
    this.check()
    this.calls.push({ op: 'publish', sessionId, tracks })
    return { sessionDescription: { type: 'answer', sdp: 'sfu-answer' }, requiresImmediateRenegotiation: false, tracks }
  }

  async pull(sessionId: string, tracks: RemoteTrack[]): Promise<Negotiation> {
    this.check()
    this.calls.push({ op: 'pull', sessionId, tracks })
    return {
      sessionDescription: { type: 'offer', sdp: 'sfu-offer' },
      requiresImmediateRenegotiation: true,
      tracks: tracks.map(({ trackName }) => ({ mid: `r${++this.mids}`, trackName })),
    }
  }

  async renegotiate(sessionId: string): Promise<void> {
    this.check()
    this.calls.push({ op: 'renegotiate', sessionId })
  }

  async setLayer(sessionId: string, mid: string, track: RemoteTrack & { layer: SfuLayer }): Promise<void> {
    this.check()
    this.calls.push({ op: 'setLayer', sessionId, mid, track })
  }

  async close(sessionId: string, mids: string[], offer?: SessionDescription): Promise<SessionDescription | null> {
    this.check()
    this.calls.push({ op: 'close', sessionId, mids, negotiated: Boolean(offer) })
    return offer ? { type: 'answer', sdp: 'sfu-close-answer' } : null
  }

  private check() {
    if (this.failing) throw new SfuFailedError()
  }
}

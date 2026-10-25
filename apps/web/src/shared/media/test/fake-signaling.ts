import { vi } from 'vitest'

import type { SignalKind, SignalingChannel } from '../media-transport'

type SentSignal = { to: string; kind: SignalKind; data: unknown }

/** Signaling that records what is sent and lets specs deliver signals as if the API relayed them. */
class FakeSignaling implements SignalingChannel {
  readonly sent: SentSignal[] = []
  private readonly handlers = new Set<(from: string, kind: SignalKind, data: unknown) => void>()
  readonly send = vi.fn(async (to: string, kind: SignalKind, data: unknown) => {
    this.sent.push({ to, kind, data })
  })

  onSignal(handler: (from: string, kind: SignalKind, data: unknown) => void) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  deliver(from: string, kind: SignalKind, data: unknown) {
    for (const handler of [...this.handlers]) handler(from, kind, data)
  }

  get listenerCount() {
    return this.handlers.size
  }

  ofKind(kind: SignalKind) {
    return this.sent.filter((signal) => signal.kind === kind)
  }
}

export { FakeSignaling }
export type { SentSignal }

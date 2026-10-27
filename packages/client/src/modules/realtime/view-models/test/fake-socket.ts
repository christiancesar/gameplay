import { vi } from 'vitest'

import type { SocketLike } from '@/modules/realtime/model/services/realtime.service'

type Handler = (...args: never[]) => void
type AckReply = { ok: true; data: undefined } | { ok: false; error: { code: string; message: string } }

/** In-memory Socket.IO client. Specs push server events with `receive` and inspect what the app sent. */
class FakeSocket implements SocketLike {
  connected = false
  active = true
  readonly connect = vi.fn(() => {
    this.active = true
    this.receive('connect')
  })
  readonly disconnect = vi.fn(() => {
    this.active = false
    this.receive('disconnect', 'io client disconnect')
  })
  /** What every ack receives: set it before the action under test. */
  ackReply: AckReply = { ok: true, data: undefined }
  readonly emitted: { event: string; args: unknown[] }[] = []
  private readonly handlers = new Map<string, Set<Handler>>()

  on(event: string, handler: Handler) {
    const set = this.handlers.get(event) ?? new Set()
    set.add(handler)
    this.handlers.set(event, set)
  }

  off(event: string, handler: Handler) {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: string, ...args: unknown[]) {
    this.emitted.push({ event, args })
    const ack = args.at(-1)
    if (typeof ack === 'function') ack(this.ackReply)
  }

  listenerCount(event: string) {
    return this.handlers.get(event)?.size ?? 0
  }

  /** Simulates an event from the server (or a lifecycle event of the client). */
  receive(event: string, ...args: unknown[]) {
    if (event === 'connect') this.connected = true
    if (event === 'disconnect') this.connected = false
    for (const handler of [...(this.handlers.get(event) ?? [])]) (handler as (...a: unknown[]) => void)(...args)
  }

  /** Back to a fresh socket between specs. */
  reset() {
    this.connected = false
    this.active = true
    this.ackReply = { ok: true, data: undefined }
    this.emitted.length = 0
    this.handlers.clear()
    this.connect.mockClear()
    this.disconnect.mockClear()
  }
}

export { FakeSocket }

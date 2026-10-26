import type { Participant, ServerToClientEvents } from '@gameplay/contracts'
import { vi } from 'vitest'

import type { ConnectionStatus } from '@/modules/realtime/model/services/realtime.service'

import type { VoiceRealtime } from '../voice-session.service'

type Handler = (payload: never) => void

/** Socket side of the call: records emits, answers joins, and lets specs push server events. */
class FakeVoiceRealtime implements VoiceRealtime {
  participants: Participant[] = []
  joinError: Error | null = null
  readonly joinRoom = vi.fn(async (_payload: { roomId: string; muted?: boolean; deafened?: boolean }) => {
    if (this.joinError) throw this.joinError
    return this.participants
  })
  readonly leaveRoom = vi.fn(async () => undefined)
  readonly sendVoiceState = vi.fn(async () => undefined)
  readonly stopStream = vi.fn(async () => undefined)
  private readonly handlers = new Map<string, Set<Handler>>()
  private readonly statusHandlers = new Set<(status: ConnectionStatus) => void>()

  on<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]) {
    const set = this.handlers.get(event) ?? new Set()
    set.add(handler as unknown as Handler)
    this.handlers.set(event, set)
    return () => {
      set.delete(handler as unknown as Handler)
    }
  }

  onStatusChange(handler: (status: ConnectionStatus) => void) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  receive<E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>) {
    for (const handler of [...(this.handlers.get(event) ?? [])]) (handler as (...a: unknown[]) => void)(...args)
  }

  setStatus(status: ConnectionStatus) {
    for (const handler of [...this.statusHandlers]) handler(status)
  }

  get listenerCount() {
    return this.statusHandlers.size + [...this.handlers.values()].reduce((sum, set) => sum + set.size, 0)
  }
}

export { FakeVoiceRealtime }

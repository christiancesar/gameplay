import type { ServerToClientEvents } from '@gameplay/contracts'
import { vi } from 'vitest'

type Handler = (payload: never) => void

/** Socket side of screen share and watching: records emits and lets specs push server events. */
class FakeStreamRealtime {
  startError: Error | null = null
  watchError: Error | null = null
  readonly startStream = vi.fn(async (_preset: string) => {
    if (this.startError) throw this.startError
  })
  readonly stopStream = vi.fn(async () => undefined)
  readonly watchStream = vi.fn(async (_streamerId: string) => {
    if (this.watchError) throw this.watchError
  })
  readonly unwatchStream = vi.fn(async (_streamerId: string) => undefined)
  readonly sendStreamQuality = vi.fn(async (_streamerId: string, _level: string) => undefined)
  readonly reportMediaUsage = vi.fn(async (_usage: unknown) => undefined)
  private readonly handlers = new Map<string, Set<Handler>>()

  on<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]) {
    const set = this.handlers.get(event) ?? new Set()
    set.add(handler as unknown as Handler)
    this.handlers.set(event, set)
    return () => {
      set.delete(handler as unknown as Handler)
    }
  }

  receive<E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>) {
    for (const handler of [...(this.handlers.get(event) ?? [])]) (handler as (...a: unknown[]) => void)(...args)
  }

  get listenerCount() {
    return [...this.handlers.values()].reduce((sum, set) => sum + set.size, 0)
  }
}

export { FakeStreamRealtime }

import type { AckResponse } from '@gameplay/shared'
import { resolveError } from './resolve-error'

// Turns an error thrown while handling a Socket.IO event into the ack reply.
export function toAckError(exception: unknown): AckResponse<never> {
  return { ok: false, error: resolveError(exception).body }
}

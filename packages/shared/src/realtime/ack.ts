import type { ErrorBody } from '../http/error.js'

// Reply of a Socket.IO event that expects an answer (last argument of emit).
export type AckResponse<T = void> = { ok: true; data: T } | { ok: false; error: ErrorBody }

export type Ack<T = void> = (response: AckResponse<T>) => void

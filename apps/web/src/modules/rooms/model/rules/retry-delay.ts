const BASE_MS = 2_000
const MAX_MS = 15_000

/** Wait before retry number `attempt` (0 based) of a failed peer: doubles up to a cap. */
function peerRetryDelayMs(attempt: number): number {
  return Math.min(MAX_MS, BASE_MS * 2 ** attempt)
}

export { peerRetryDelayMs }

export type ComponentStatus = 'operational' | 'degraded' | 'outage'

export type ComponentReport = { status: ComponentStatus; latencyMs: number }

// A check that takes longer than this is an outage; slower than SLOW_CHECK_MS, degraded.
export const CHECK_TIMEOUT_MS = 2000
export const SLOW_CHECK_MS = 1000

class CheckTimeout extends Error {}

// Fails with CheckTimeout when `work` doesn't settle within `ms`.
export async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new CheckTimeout(`Check timed out after ${ms} ms`)), ms)
  })
  try {
    return await Promise.race([work, deadline])
  } finally {
    clearTimeout(timer)
  }
}

// Runs one health check and grades it. The error itself is dropped: the
// public report must not leak hosts or messages.
export async function probe(check: () => Promise<unknown>, timeoutMs = CHECK_TIMEOUT_MS): Promise<ComponentReport> {
  const startedAt = performance.now()
  let failed = false
  try {
    await withTimeout(check(), timeoutMs)
  } catch {
    failed = true
  }
  const latencyMs = Math.round(performance.now() - startedAt)
  if (failed) return { status: 'outage', latencyMs }
  return { status: latencyMs > SLOW_CHECK_MS ? 'degraded' : 'operational', latencyMs }
}

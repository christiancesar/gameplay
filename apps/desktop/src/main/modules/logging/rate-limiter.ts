/**
 * At most `limit` events per `windowMs`; the rest are counted. A page that fails in a loop would otherwise fill the
 * log, and the telemetry, with the same line thousands of times.
 */
export class RateLimiter {
  private readonly limit: number
  private readonly windowMs: number
  private readonly now: () => number
  private windowStart = 0
  private taken = 0
  private suppressed = 0

  constructor(limit: number, windowMs: number, now: () => number = Date.now) {
    this.limit = limit
    this.windowMs = windowMs
    this.now = now
  }

  /** Whether this event may be logged. */
  allow(): boolean {
    const now = this.now()
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now
      this.taken = 0
    }
    if (this.taken < this.limit) {
      this.taken++
      return true
    }
    this.suppressed++
    return false
  }

  /** How many were dropped since the last time this was asked; zero afterwards. */
  takeSuppressed(): number {
    const count = this.suppressed
    this.suppressed = 0
    return count
  }
}

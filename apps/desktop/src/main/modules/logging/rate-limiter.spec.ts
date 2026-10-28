import { describe, expect, it } from 'vitest'

import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  it('lets the limit through in a window, drops the rest and counts them', () => {
    let now = 1000
    const limiter = new RateLimiter(2, 60_000, () => now)

    expect([limiter.allow(), limiter.allow(), limiter.allow(), limiter.allow()]).toEqual([true, true, false, false])
    expect(limiter.takeSuppressed()).toBe(2)
    expect(limiter.takeSuppressed()).toBe(0)

    now += 60_000
    expect(limiter.allow()).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'

import { defaultUsageRange, usageRangeLimits } from './usage-range-limits'

const now = new Date('2026-10-27T02:00:00Z')

describe('usageRangeLimits', () => {
  it('allows the last 30 UTC days', () => {
    expect(usageRangeLimits(now)).toEqual({ min: '2026-09-27', max: '2026-10-27' })
  })

  it('suggests the last 7 days', () => {
    expect(defaultUsageRange(now)).toEqual({ from: '2026-10-21', to: '2026-10-27' })
  })
})

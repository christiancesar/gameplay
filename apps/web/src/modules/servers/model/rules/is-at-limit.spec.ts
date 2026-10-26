import { describe, expect, it } from 'vitest'

import { isAtLimit } from './is-at-limit'

describe('isAtLimit', () => {
  it('is false below the limit and true at or above it', () => {
    expect(isAtLimit(9, 10)).toBe(false)
    expect(isAtLimit(10, 10)).toBe(true)
    expect(isAtLimit(11, 10)).toBe(true)
  })
})

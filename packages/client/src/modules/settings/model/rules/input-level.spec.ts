import { describe, expect, it } from 'vitest'

import { levelFromSamples } from './input-level'

describe('levelFromSamples', () => {
  it('is 0 for silence and for no samples', () => {
    expect(levelFromSamples(new Uint8Array(64).fill(128))).toBe(0)
    expect(levelFromSamples(new Uint8Array(0))).toBe(0)
  })

  it('grows with the amplitude', () => {
    const quiet = levelFromSamples(Uint8Array.from({ length: 64 }, (_, i) => (i % 2 ? 132 : 124)))
    const loud = levelFromSamples(Uint8Array.from({ length: 64 }, (_, i) => (i % 2 ? 160 : 96)))
    expect(quiet).toBeGreaterThan(0)
    expect(loud).toBeGreaterThan(quiet)
  })

  it('never goes above 1', () => {
    expect(levelFromSamples(Uint8Array.from({ length: 64 }, (_, i) => (i % 2 ? 255 : 0)))).toBe(1)
  })
})

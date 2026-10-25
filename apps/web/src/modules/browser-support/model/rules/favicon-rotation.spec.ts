import { describe, expect, it } from 'vitest'

import { nextIconIndex, shouldRotateFavicon } from './favicon-rotation'

describe('nextIconIndex', () => {
  it('advances and wraps', () => {
    expect(nextIconIndex(0, 3)).toBe(1)
    expect(nextIconIndex(2, 3)).toBe(0)
  })

  it('stays at zero with no icons', () => {
    expect(nextIconIndex(0, 0)).toBe(0)
  })
})

describe('shouldRotateFavicon', () => {
  it('rotates only for a visible tab without reduced motion', () => {
    expect(shouldRotateFavicon({ hidden: false, reducedMotion: false })).toBe(true)
    expect(shouldRotateFavicon({ hidden: true, reducedMotion: false })).toBe(false)
    expect(shouldRotateFavicon({ hidden: false, reducedMotion: true })).toBe(false)
  })
})

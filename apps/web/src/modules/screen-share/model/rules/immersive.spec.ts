import { describe, expect, it } from 'vitest'

import { isImmersive } from './immersive'

describe('isImmersive', () => {
  it('when asked, or on a phone turned sideways unless the viewer left it there', () => {
    expect(isImmersive({ expanded: true, phoneLandscape: false, landscapeOptOut: false })).toBe(true)
    expect(isImmersive({ expanded: false, phoneLandscape: true, landscapeOptOut: false })).toBe(true)
    expect(isImmersive({ expanded: false, phoneLandscape: true, landscapeOptOut: true })).toBe(false)
    expect(isImmersive({ expanded: false, phoneLandscape: false, landscapeOptOut: false })).toBe(false)
  })
})

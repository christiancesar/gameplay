import { describe, expect, it } from 'vitest'

import { isPreviewHiddenByDefault, toSurface } from './surface'

describe('surface', () => {
  it('narrows what the browser reports', () => {
    expect(toSurface('monitor')).toBe('monitor')
    expect(toSurface('window')).toBe('window')
    expect(toSurface('browser')).toBe('browser')
    expect(toSurface('other')).toBe('unknown')
    expect(toSurface(undefined)).toBe('unknown')
  })

  it('hides the preview by default only for the entire screen', () => {
    expect(isPreviewHiddenByDefault('monitor')).toBe(true)
    expect(isPreviewHiddenByDefault('window')).toBe(false)
    expect(isPreviewHiddenByDefault('browser')).toBe(false)
    expect(isPreviewHiddenByDefault('unknown')).toBe(false)
  })
})

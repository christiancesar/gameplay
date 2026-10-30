import { describe, expect, it } from 'vitest'

import { safeRedirect } from './safe-redirect'

describe('safeRedirect', () => {
  it('keeps same-origin paths with query and hash', () => {
    expect(safeRedirect('/i/ABC123')).toBe('/i/ABC123')
    expect(safeRedirect('/servers/1?tab=rooms#top')).toBe('/servers/1?tab=rooms#top')
  })

  it('falls back when empty or missing', () => {
    expect(safeRedirect(undefined)).toBe('/hub')
    expect(safeRedirect('')).toBe('/hub')
  })

  it('rejects protocol-relative and backslash forms', () => {
    expect(safeRedirect('//evil.com')).toBe('/hub')
    expect(safeRedirect('/\\evil.com')).toBe('/hub')
  })

  it('rejects absolute urls and relative paths', () => {
    expect(safeRedirect('https://evil.com')).toBe('/hub')
    expect(safeRedirect('javascript:alert(1)')).toBe('/hub')
    expect(safeRedirect('servers/1')).toBe('/hub')
  })

  it('rejects control characters', () => {
    expect(safeRedirect('/\t/evil.com')).toBe('/hub')
  })
})

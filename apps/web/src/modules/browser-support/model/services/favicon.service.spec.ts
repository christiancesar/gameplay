import { afterEach, describe, expect, it } from 'vitest'

import { FAVICON_ICONS, iconToDataUrl, setFavicon } from './favicon.service'

describe('iconToDataUrl', () => {
  it('renders every gaming icon as an svg data url', () => {
    for (const icon of FAVICON_ICONS) {
      const url = iconToDataUrl(icon)
      expect(url.startsWith('data:image/svg+xml,')).toBe(true)
      const svg = decodeURIComponent(url.slice('data:image/svg+xml,'.length))
      expect(svg).toContain('<svg')
      expect(svg).toContain('stroke="#10b981"')
    }
  })

  it('gives each icon its own image', () => {
    expect(new Set(FAVICON_ICONS.map((icon) => iconToDataUrl(icon))).size).toBe(FAVICON_ICONS.length)
  })
})

describe('setFavicon', () => {
  afterEach(() => {
    document.head.innerHTML = ''
  })

  it('updates the existing icon link', () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.svg" />'
    setFavicon('data:image/svg+xml,a')
    expect(document.head.querySelectorAll('link[rel~="icon"]')).toHaveLength(1)
    expect(document.head.querySelector('link')?.getAttribute('href')).toBe('data:image/svg+xml,a')
  })

  it('creates the link when the page has none', () => {
    setFavicon('data:image/svg+xml,b')
    expect(document.head.querySelector('link[rel~="icon"]')?.getAttribute('href')).toBe('data:image/svg+xml,b')
  })
})

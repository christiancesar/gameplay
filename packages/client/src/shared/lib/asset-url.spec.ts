import { afterEach, describe, expect, it } from 'vitest'

import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { assetUrl } from './asset-url'

describe('assetUrl', () => {
  afterEach(() => {
    setCurrentPlatform(new FakePlatform())
  })

  it('uses the desktop server for a relative upload path', () => {
    setCurrentPlatform(new FakePlatform({ kind: 'desktop', baseUrl: 'https://play.example.com' }))

    expect(assetUrl('/uploads/icons/server.webp')).toBe('https://play.example.com/uploads/icons/server.webp')
  })

  it('keeps relative paths on the web and absolute or local assets unchanged', () => {
    setCurrentPlatform(new FakePlatform())

    expect(assetUrl('/uploads/icons/server.webp')).toBe('/uploads/icons/server.webp')
    expect(assetUrl('blob:http://localhost:5173/preview')).toBe('blob:http://localhost:5173/preview')
    expect(assetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })
})

import { describe, expect, it } from 'vitest'

import { detectCapturePlatform } from './capture-platform'

const FIREFOX_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0'
const CHROME_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'

describe('detectCapturePlatform', () => {
  it('reads browser and system from the user agent', () => {
    expect(detectCapturePlatform({ userAgent: FIREFOX_WINDOWS })).toEqual({
      engine: 'firefox',
      chromiumMajor: 0,
      os: 'windows',
      browser: 'Firefox',
    })
    expect(detectCapturePlatform({ userAgent: CHROME_LINUX })).toMatchObject({
      engine: 'chromium',
      chromiumMajor: 141,
      os: 'linux',
    })
    expect(detectCapturePlatform({ userAgent: SAFARI_MAC })).toMatchObject({ engine: 'safari', os: 'mac' })
    expect(detectCapturePlatform({ userAgent: CHROME_ANDROID })).toMatchObject({ os: 'android' })
  })

  it('prefers the Client Hints platform', () => {
    const platform = detectCapturePlatform({
      userAgent: CHROME_LINUX,
      userAgentData: {
        platform: 'macOS',
        brands: [
          { brand: 'Chromium', version: '142' },
          { brand: 'Google Chrome', version: '142' },
        ],
      },
    })
    expect(platform).toEqual({ engine: 'chromium', chromiumMajor: 142, os: 'mac', browser: 'Chrome' })
  })
})

import { describe, expect, it } from 'vitest'

import { CHROME_130, EDGE_120, FIREFOX_144, OPERA_110, SAFARI_18 } from '../test/user-agents'
import { detectBrowser } from './detect-browser'

describe('detectBrowser', () => {
  describe('with Client Hints', () => {
    it('picks the real brand over Chromium and ignores the grease entry', () => {
      const browser = detectBrowser({
        userAgentData: {
          brands: [
            { brand: 'Not/A)Brand', version: '8' },
            { brand: 'Chromium', version: '130' },
            { brand: 'Brave', version: '1' },
          ],
        },
      })
      expect(browser).toEqual({ name: 'Brave', version: '1', chromiumMajor: 130, isChromium: true })
    })

    it('shortens Google Chrome and Microsoft Edge', () => {
      const chrome = detectBrowser({
        userAgentData: {
          brands: [
            { brand: 'Chromium', version: '131' },
            { brand: 'Google Chrome', version: '131' },
          ],
        },
      })
      const edge = detectBrowser({
        userAgentData: {
          brands: [
            { brand: 'Chromium', version: '131' },
            { brand: 'Microsoft Edge', version: '131' },
          ],
        },
      })
      expect([chrome.name, edge.name]).toEqual(['Chrome', 'Edge'])
    })

    it('falls back to Chromium when it is the only real brand', () => {
      const browser = detectBrowser({ userAgentData: { brands: [{ brand: 'Chromium', version: '130' }] } })
      expect(browser.name).toBe('Chromium')
    })

    it('falls back to the user agent when the brands have no Chromium', () => {
      const browser = detectBrowser({
        userAgentData: { brands: [{ brand: 'Not/A)Brand', version: '8' }] },
        userAgent: FIREFOX_144,
      })
      expect(browser.name).toBe('Firefox')
    })
  })

  describe('with the user agent only', () => {
    it.each([
      [CHROME_130, { name: 'Chrome', version: '130.0.0.0', chromiumMajor: 130, isChromium: true }],
      [EDGE_120, { name: 'Edge', version: '120.0.2210.91', chromiumMajor: 120, isChromium: true }],
      [OPERA_110, { name: 'Opera', version: '110.0.0.0', chromiumMajor: 124, isChromium: true }],
      [FIREFOX_144, { name: 'Firefox', version: '144.0', chromiumMajor: 0, isChromium: false }],
      [SAFARI_18, { name: 'Safari', version: '18.4', chromiumMajor: 0, isChromium: false }],
    ])('reads %s', (userAgent, expected) => {
      expect(detectBrowser({ userAgent })).toEqual(expected)
    })

    it('treats an unknown or missing user agent as not Chromium', () => {
      expect(detectBrowser({ userAgent: 'curl/8.0' }).isChromium).toBe(false)
      expect(detectBrowser({}).name).toBe('Unknown')
    })
  })
})

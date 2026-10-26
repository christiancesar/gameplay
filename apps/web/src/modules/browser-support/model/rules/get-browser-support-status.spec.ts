import { describe, expect, it } from 'vitest'

import type { DetectedBrowser } from './detect-browser'
import { getBrowserSupportStatus } from './get-browser-support-status'

const chrome = (chromiumMajor: number): DetectedBrowser => ({
  name: 'Chrome',
  version: String(chromiumMajor),
  chromiumMajor,
  isChromium: true,
})
const firefox: DetectedBrowser = { name: 'Firefox', version: '144', chromiumMajor: 0, isChromium: false }

describe('getBrowserSupportStatus', () => {
  it('flags a browser that is not Chromium', () => {
    expect(getBrowserSupportStatus(firefox, 130)).toEqual({
      type: 'unsupported',
      browser: { name: 'Firefox', version: '144' },
    })
  })

  it('flags a Chromium below the minimum', () => {
    expect(getBrowserSupportStatus(chrome(109), 130)).toEqual({
      type: 'outdated',
      browser: { name: 'Chrome', version: '109' },
      minVersion: 130,
    })
  })

  it('accepts the minimum itself and anything above', () => {
    expect(getBrowserSupportStatus(chrome(130), 130)).toBeNull()
    expect(getBrowserSupportStatus(chrome(140), 130)).toBeNull()
  })

  it('only checks the engine when the minimum is unknown', () => {
    expect(getBrowserSupportStatus(chrome(80))).toBeNull()
    expect(getBrowserSupportStatus(firefox)?.type).toBe('unsupported')
  })
})

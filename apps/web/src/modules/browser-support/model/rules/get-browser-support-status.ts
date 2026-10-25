import type { BrowserSupportStatus } from '@/modules/browser-support/model/entities/browser-support-status'

import type { DetectedBrowser } from './detect-browser'

/**
 * Not Chromium: unsupported. Chromium below the minimum: outdated. Otherwise null.
 * Without the minimum (the settings request failed) only the engine is checked.
 */
function getBrowserSupportStatus(browser: DetectedBrowser, minVersion?: number): BrowserSupportStatus | null {
  const info = { name: browser.name, version: browser.version }
  if (!browser.isChromium) return { type: 'unsupported', browser: info }
  if (minVersion !== undefined && browser.chromiumMajor < minVersion) {
    return { type: 'outdated', browser: info, minVersion }
  }
  return null
}

export { getBrowserSupportStatus }

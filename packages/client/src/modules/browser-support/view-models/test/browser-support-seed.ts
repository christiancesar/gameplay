import type { BrowserSource } from '../../model/rules/detect-browser'
import type { GpuInfo } from '../../model/rules/is-acceleration-off'
import { CHROME_130, FIREFOX_144 } from '../../model/test/user-agents'

const chromeBrowser: BrowserSource = { userAgent: CHROME_130 }
const outdatedChrome: BrowserSource = {
  userAgentData: {
    brands: [
      { brand: 'Chromium', version: '109' },
      { brand: 'Google Chrome', version: '109' },
    ],
  },
}
const firefoxBrowser: BrowserSource = { userAgent: FIREFOX_144 }

const realGpu: GpuInfo = { webgl: true, renderer: 'ANGLE (NVIDIA, GeForce RTX 4070)' }
const softwareGpu: GpuInfo = { webgl: true, renderer: 'ANGLE (Google, SwiftShader driver)' }

const iceConfig = {
  iceServers: [{ urls: ['stun:stun.example.com:3478'] }],
  ttlSeconds: 3600,
  requestIp: '203.0.113.7',
}

export { chromeBrowser, firefoxBrowser, iceConfig, outdatedChrome, realGpu, softwareGpu }

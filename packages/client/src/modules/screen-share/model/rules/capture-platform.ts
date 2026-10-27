import { type BrowserSource, detectBrowser } from '@/modules/browser-support/model/rules/detect-browser'

type CaptureEngine = 'chromium' | 'firefox' | 'safari' | 'other'
type CaptureOs = 'windows' | 'mac' | 'linux' | 'chromeos' | 'android' | 'ios' | 'other'

/** What decides which screen audio the browser can capture. */
type CapturePlatform = {
  engine: CaptureEngine
  /** The Chromium major version, 0 outside Chromium. */
  chromiumMajor: number
  os: CaptureOs
  /** Name of the browser, for the reports (Chrome, Edge, Firefox). */
  browser: string
}

type CapturePlatformSource = BrowserSource & {
  userAgentData?: { platform?: string }
}

const HINT_PLATFORMS: Record<string, CaptureOs> = {
  Windows: 'windows',
  macOS: 'mac',
  Linux: 'linux',
  'Chrome OS': 'chromeos',
  ChromeOS: 'chromeos',
  Android: 'android',
}

// Order matters: Android also carries "Linux".
const USER_AGENT_OS: { os: CaptureOs; pattern: RegExp }[] = [
  { os: 'windows', pattern: /Windows/ },
  { os: 'ios', pattern: /iPhone|iPad|iPod/ },
  { os: 'mac', pattern: /Macintosh|Mac OS X/ },
  { os: 'chromeos', pattern: /CrOS/ },
  { os: 'android', pattern: /Android/ },
  { os: 'linux', pattern: /Linux/ },
]

function osOf({ userAgentData, userAgent = '' }: CapturePlatformSource): CaptureOs {
  const hinted = userAgentData?.platform ? HINT_PLATFORMS[userAgentData.platform] : undefined
  if (hinted) return hinted
  return USER_AGENT_OS.find(({ pattern }) => pattern.test(userAgent))?.os ?? 'other'
}

function engineOf(name: string, isChromium: boolean): CaptureEngine {
  if (isChromium) return 'chromium'
  if (name === 'Firefox') return 'firefox'
  return name === 'Safari' ? 'safari' : 'other'
}

/** Reads the browser and the system from Client Hints, falling back to the user agent string. */
function detectCapturePlatform(source: CapturePlatformSource): CapturePlatform {
  const browser = detectBrowser(source)
  return {
    engine: engineOf(browser.name, browser.isChromium),
    chromiumMajor: browser.chromiumMajor,
    os: osOf(source),
    browser: browser.name,
  }
}

export { detectCapturePlatform }
export type { CaptureEngine, CaptureOs, CapturePlatform, CapturePlatformSource }

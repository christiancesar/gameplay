type BrandEntry = { brand: string; version: string }

type BrowserSource = {
  userAgentData?: { brands?: readonly BrandEntry[] }
  userAgent?: string
}

type DetectedBrowser = {
  name: string
  /** Version to show: the browser's own, when the brand list has it. */
  version: string
  /** The Chromium engine major version, 0 when the browser is not Chromium based. */
  chromiumMajor: number
  isChromium: boolean
}

const GREASE_BRAND = /not.?a.?brand|^$/i
const BRAND_NAMES: Record<string, string> = { 'Google Chrome': 'Chrome', 'Microsoft Edge': 'Edge' }

const major = (version: string) => Number.parseInt(version, 10) || 0

/** Client Hints: the engine is the "Chromium" brand, the browser is any other real brand. */
function fromBrands(brands: readonly BrandEntry[]): DetectedBrowser | null {
  const real = brands.filter((entry) => !GREASE_BRAND.test(entry.brand))
  const engine = real.find((entry) => entry.brand === 'Chromium')
  if (!engine) return null
  const named = real.find((entry) => entry.brand !== 'Chromium') ?? engine
  return {
    name: BRAND_NAMES[named.brand] ?? named.brand,
    version: named.version,
    chromiumMajor: major(engine.version),
    isChromium: true,
  }
}

// Order matters: Edge, Opera and Samsung also carry "Chrome/", Chrome carries "Safari/".
const USER_AGENT_BROWSERS: { name: string; pattern: RegExp; chromium: boolean }[] = [
  { name: 'Edge', pattern: /\bEdg(?:e|A|iOS)?\/([\d.]+)/, chromium: true },
  { name: 'Opera', pattern: /\bOPR\/([\d.]+)/, chromium: true },
  { name: 'Firefox', pattern: /\b(?:Firefox|FxiOS)\/([\d.]+)/, chromium: false },
  { name: 'Chrome', pattern: /\b(?:Chrome|CriOS)\/([\d.]+)/, chromium: true },
  { name: 'Safari', pattern: /\bVersion\/([\d.]+).*Safari\//, chromium: false },
]

function fromUserAgent(userAgent: string): DetectedBrowser {
  const engine = /\bChrome\/([\d.]+)/.exec(userAgent)
  for (const { name, pattern, chromium } of USER_AGENT_BROWSERS) {
    const match = pattern.exec(userAgent)
    if (!match) continue
    return {
      name,
      version: match[1],
      chromiumMajor: chromium ? major(engine?.[1] ?? match[1]) : 0,
      isChromium: chromium,
    }
  }
  return { name: 'Unknown', version: '0', chromiumMajor: 0, isChromium: false }
}

/** Reads `navigator.userAgentData` brands first and falls back to the user agent string. */
function detectBrowser({ userAgentData, userAgent }: BrowserSource): DetectedBrowser {
  const fromHints = userAgentData?.brands ? fromBrands(userAgentData.brands) : null
  return fromHints ?? fromUserAgent(userAgent ?? '')
}

export { detectBrowser }
export type { BrowserSource, DetectedBrowser }

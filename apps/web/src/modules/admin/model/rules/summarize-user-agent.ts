const BROWSERS: readonly [name: string, pattern: RegExp][] = [
  ['Edge', /Edg(?:e|A|iOS)?\/(\d+)/],
  ['Opera', /OPR\/(\d+)/],
  ['Firefox', /Firefox\/(\d+)/],
  ['Chrome', /Chrome\/(\d+)/],
  ['Safari', /Version\/(\d+).*Safari/],
]

const SYSTEMS: readonly [name: string, pattern: RegExp][] = [
  ['Windows', /Windows NT/],
  ['Android', /Android/],
  ['iOS', /iPhone|iPad|iPod/],
  ['macOS', /Mac OS X/],
  ['Linux', /Linux|X11/],
]

const UNKNOWN = '–'

/** "Chrome 141 · Windows" out of a raw user agent. Chromium forks come first in the list because they also say "Chrome". */
function summarizeUserAgent(userAgent: string | null): string {
  if (!userAgent) return UNKNOWN
  const browser = BROWSERS.map(([name, pattern]) => {
    const version = pattern.exec(userAgent)?.[1]
    return version ? `${name} ${version}` : undefined
  }).find(Boolean)
  const system = SYSTEMS.find(([, pattern]) => pattern.test(userAgent))?.[0]
  return [browser, system].filter(Boolean).join(' · ') || userAgent.slice(0, 40)
}

export { summarizeUserAgent }

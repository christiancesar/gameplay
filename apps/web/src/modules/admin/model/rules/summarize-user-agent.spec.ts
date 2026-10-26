import { describe, expect, it } from 'vitest'

import { summarizeUserAgent } from './summarize-user-agent'

const chromeWindows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

describe('summarizeUserAgent', () => {
  it('names the browser version and the system', () => {
    expect(summarizeUserAgent(chromeWindows)).toBe('Chrome 141 · Windows')
  })

  it('tells Edge apart from Chrome', () => {
    expect(summarizeUserAgent(`${chromeWindows} Edg/140.0.0.0`)).toBe('Edge 140 · Windows')
  })

  it('reads Android Chrome and Firefox on Linux', () => {
    expect(summarizeUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/141.0.0.0 Mobile Safari/537.36')).toBe(
      'Chrome 141 · Android',
    )
    expect(summarizeUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0')).toBe(
      'Firefox 130 · Linux',
    )
  })

  it('reads Safari on macOS', () => {
    expect(
      summarizeUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      ),
    ).toBe('Safari 17 · macOS')
  })

  it('falls back to a dash without a user agent and to the raw start when nothing matches', () => {
    expect(summarizeUserAgent(null)).toBe('–')
    expect(summarizeUserAgent('curl/8.18.0')).toBe('curl/8.18.0')
  })
})

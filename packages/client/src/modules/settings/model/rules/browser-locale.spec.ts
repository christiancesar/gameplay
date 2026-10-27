import { describe, expect, it } from 'vitest'

import { browserLocale } from './browser-locale'

describe('browserLocale', () => {
  it('matches the base language of a regional tag', () => {
    expect(browserLocale(['pt-BR', 'en-US'])).toBe('pt')
  })

  it('skips unsupported languages in order', () => {
    expect(browserLocale(['fr-FR', 'en-GB'])).toBe('en')
    expect(browserLocale(['fr', 'pt'])).toBe('pt')
  })

  it('falls back to en', () => {
    expect(browserLocale(['de'])).toBe('en')
    expect(browserLocale([])).toBe('en')
  })
})

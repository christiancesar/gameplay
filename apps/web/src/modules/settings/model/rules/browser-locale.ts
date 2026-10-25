import { LOCALES, type Locale } from '@gameplay/contracts'

/** First supported language among the browser's preferences ("pt-BR" counts as pt), en when none matches. */
function browserLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0]
    const match = LOCALES.find((locale) => locale === base)
    if (match) return match
  }
  return 'en'
}

export { browserLocale }

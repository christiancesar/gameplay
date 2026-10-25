import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LOCALES, type Locale } from '@gameplay/contracts'

import type { LanguageOption } from '@/shared/ui/language-switcher'

export type Language = Locale

const LANGUAGE_OPTIONS: readonly LanguageOption[] = LOCALES.map((value) => ({ value, label: value.toUpperCase() }))

function isLanguage(value: string): value is Language {
  return (LOCALES as readonly string[]).includes(value)
}

export function useLanguageViewModel() {
  const { i18n } = useTranslation()

  const resolved = i18n.resolvedLanguage || i18n.language || 'en'
  const language: Language = isLanguage(resolved) ? resolved : 'en'
  const setLanguage = useCallback(
    (next: string) => {
      if (isLanguage(next)) void i18n.changeLanguage(next)
    },
    [i18n],
  )

  return { language, languageOptions: LANGUAGE_OPTIONS, setLanguage }
}

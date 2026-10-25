import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export type Language = 'en' | 'pt'

export function useLanguageViewModel() {
  const { i18n } = useTranslation()

  const language = (i18n.resolvedLanguage || i18n.language || 'en') as Language
  const setLanguage = useCallback(
    (next: Language) => {
      void i18n.changeLanguage(next)
    },
    [i18n],
  )

  return {
    language,
    setLanguage,
  }
}

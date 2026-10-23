import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES } from '@/shared/i18n'

export const languageOptions = SUPPORTED_LANGUAGES.map((value) => ({ value, label: value.toUpperCase() }))

/** Liga o seletor de idioma da View ao i18n real, para trocar o idioma de dentro da story. */
export function useStoryLanguage() {
  const { i18n } = useTranslation()
  return {
    language: i18n.resolvedLanguage ?? 'en',
    languageOptions,
    onLanguageChange: (language: string) => void i18n.changeLanguage(language),
  }
}

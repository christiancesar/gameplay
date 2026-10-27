/** `useTranslation` that answers with the key itself, so specs can assert on i18n keys. */
const fakeI18nModule = {
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', resolvedLanguage: 'en' } }),
}

export { fakeI18nModule }

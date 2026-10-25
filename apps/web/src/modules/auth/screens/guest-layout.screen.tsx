import { Outlet } from '@tanstack/react-router'

import { AuthLayoutView } from '@/modules/auth/views/auth-layout.view'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
] as const

export function GuestLayoutScreen() {
  const { language, setLanguage } = useLanguageViewModel()

  return (
    <AuthLayoutView
      language={language}
      languageOptions={LANGUAGE_OPTIONS}
      onLanguageChange={(next) => setLanguage(next as any)}
    >
      <Outlet />
    </AuthLayoutView>
  )
}

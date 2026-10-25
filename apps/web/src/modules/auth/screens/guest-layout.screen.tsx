import { Outlet } from '@tanstack/react-router'

import { AuthLayoutView } from '@/modules/auth/views/auth-layout.view'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'

export function GuestLayoutScreen() {
  const { language, setLanguage } = useLanguageViewModel()

  return <AuthLayoutView language={language} onChangeLanguage={setLanguage}><Outlet /></AuthLayoutView>
}

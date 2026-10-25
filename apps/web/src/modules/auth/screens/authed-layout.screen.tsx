import { Outlet } from '@tanstack/react-router'

import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { PendingScreen } from '@/app/pending.screen'

export function AuthedLayoutScreen() {
  const { language, setLanguage } = useLanguageViewModel()

  // Use a lightweight shell until HubLayoutView is wired up
  return <PendingScreen />
}

import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'

import type { PublicDestination } from '../model/public-destination'

function usePublicNavigationViewModel() {
  const navigate = useNavigate()
  const { data: session } = useQuery(sessionQueryOptions)
  const storedTheme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  const theme: 'dark' | 'light' = storedTheme === 'light' ? 'light' : 'dark'
  const onToggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  const onNavigate = (destination: PublicDestination) => {
    const routes = {
      home: '/',
      download: '/download',
      roadmap: '/roadmap',
      changelog: '/changelog',
      'sign-in': '/sign-in',
      'sign-up': '/sign-up',
      hub: '/hub',
    } as const

    void navigate({ to: routes[destination] })
  }

  return {
    isAuthenticated: Boolean(session),
    theme,
    language,
    languageOptions,
    onNavigate,
    onToggleTheme,
    onLanguageChange: setLanguage,
  }
}

export { usePublicNavigationViewModel }

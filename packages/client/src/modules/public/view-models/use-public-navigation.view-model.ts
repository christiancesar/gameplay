import type { Theme as AccountTheme } from '@gameplay/contracts'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { refreshSession } from '@/modules/auth/model/services/session.query'
import { updatePreferences } from '@/modules/settings/model/services/account.service'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'

import type { PublicDestination } from '../model/public-destination'

function usePublicNavigationViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { data: session } = useQuery(sessionQueryOptions)
  const storedTheme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  const themeMutation = useMutation<void, Error, AccountTheme, { theme: typeof storedTheme }>({
    mutationFn: (theme) => updatePreferences({ theme }),
    onMutate: (theme) => {
      const previous = { theme: useThemeStore.getState().theme }
      setTheme(theme)
      return previous
    },
    onSuccess: () => {
      void refreshSession(queryClient)
    },
    onError: (_error, _theme, previous) => {
      if (previous) setTheme(previous.theme)
      toast.error(t('settings.errors.unexpected'))
    },
  })

  const theme: 'dark' | 'light' = storedTheme === 'light' ? 'light' : 'dark'
  const onToggleTheme = () => {
    const nextTheme: AccountTheme = theme === 'dark' ? 'light' : 'dark'
    if (session) themeMutation.mutate(nextTheme)
    else setTheme(nextTheme)
  }
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

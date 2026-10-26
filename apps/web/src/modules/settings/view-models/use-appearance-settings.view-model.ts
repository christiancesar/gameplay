import { localeSchema, type Locale, type Theme } from '@gameplay/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { refreshSession, sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { browserLocale } from '@/modules/settings/model/rules/browser-locale'
import { updatePreferences } from '@/modules/settings/model/services/account.service'
import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'
import { useLanguageViewModel, type Language } from '@/modules/settings/view-models/use-language.view-model'

type PreferencesChange = { theme?: Theme; locale?: Locale | null }

/** What to put back when the API refuses the change. */
type Previous = { theme: Theme | 'system'; language: Language }

/**
 * Settings > Appearance. Theme and language are applied right away and saved on the account;
 * a failed save puts the previous values back. `locale: null` means "follow the browser".
 */
function useAppearanceSettingsViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  const mutation = useMutation<void, Error, PreferencesChange, Previous>({
    mutationFn: updatePreferences,
    onMutate: (change) => {
      const previous: Previous = { theme, language }
      if (change.theme) setTheme(change.theme)
      if (change.locale !== undefined) setLanguage(change.locale ?? browserLocale(navigator.languages))
      return previous
    },
    onSuccess: () => refreshSession(queryClient),
    onError: (_error, _change, previous) => {
      if (previous) {
        setTheme(previous.theme)
        setLanguage(previous.language)
      }
      toast.error(t('settings.errors.unexpected'))
    },
  })

  const accountLocale = localeSchema.safeParse(session?.user.locale)
  // While the save is in flight the session still holds the old value.
  const pendingLocale = mutation.isPending ? mutation.variables.locale : undefined
  const savedLocale = accountLocale.success ? accountLocale.data : null

  return {
    theme: theme === 'light' ? ('light' as const) : ('dark' as const),
    language: pendingLocale === undefined ? savedLocale : pendingLocale,
    languageOptions,
    onThemeChange: (next: Theme) => mutation.mutate({ theme: next }),
    onLanguageChange: (next: string | null) => {
      if (next === null) mutation.mutate({ locale: null })
      else if (localeSchema.safeParse(next).success) mutation.mutate({ locale: next as Locale })
    },
  }
}

export { useAppearanceSettingsViewModel }

import { localeSchema, themeSchema } from '@gameplay/contracts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { refreshSession, sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { updatePreferences } from '@/modules/settings/model/services/account.service'
import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'

/**
 * Applies the account's theme and language once per signed-in user, so a new browser or device
 * picks up what was saved on the account. A null locale means "follow the browser": left alone.
 */
function useAccountPreferencesSyncViewModel() {
  const queryClient = useQueryClient()
  const { data: session, isFetching } = useQuery(sessionQueryOptions)
  const localTheme = useThemeStore((state) => state.theme)
  const pendingAccountSync = useThemeStore((state) => state.pendingAccountSync)
  const setTheme = useThemeStore((state) => state.setTheme)
  const { setLanguage } = useLanguageViewModel()
  const appliedFor = useRef<string | undefined>(undefined)
  const pendingSyncingFor = useRef<string | undefined>(undefined)
  const pendingThemeOverride = useRef<'light' | 'dark' | undefined>(undefined)

  const user = session?.user
  useEffect(() => {
    if (!user || isFetching) return

    if (pendingAccountSync && (localTheme === 'light' || localTheme === 'dark')) {
      const pendingKey = `${user.id}:${localTheme}`
      if (pendingSyncingFor.current === pendingKey) return
      pendingSyncingFor.current = pendingKey
      void updatePreferences({ theme: localTheme })
        .then(() => refreshSession(queryClient))
        .then(() => {
          pendingThemeOverride.current = localTheme
          setTheme(localTheme)
        })
        .catch(() => {
          pendingSyncingFor.current = undefined
        })
      return
    }

    if (pendingThemeOverride.current) {
      if (user.theme !== pendingThemeOverride.current) return
      pendingThemeOverride.current = undefined
    }

    const preferenceKey = `${user.id}:${user.theme}:${user.locale}`
    if (appliedFor.current === preferenceKey) return
    appliedFor.current = preferenceKey
    const theme = themeSchema.safeParse(user.theme)
    if (theme.success) setTheme(theme.data)
    const locale = localeSchema.safeParse(user.locale)
    if (locale.success) setLanguage(locale.data)
  }, [isFetching, localTheme, pendingAccountSync, queryClient, user, setLanguage, setTheme])
}

export { useAccountPreferencesSyncViewModel }

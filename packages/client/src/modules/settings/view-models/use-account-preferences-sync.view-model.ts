import { localeSchema, themeSchema } from '@gameplay/contracts'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'

/**
 * Applies the account's theme and language once per signed-in user, so a new browser or device
 * picks up what was saved on the account. A null locale means "follow the browser": left alone.
 */
function useAccountPreferencesSyncViewModel() {
  const { data: session } = useQuery(sessionQueryOptions)
  const setTheme = useThemeStore((state) => state.setTheme)
  const { setLanguage } = useLanguageViewModel()
  const appliedFor = useRef<string | undefined>(undefined)

  const user = session?.user
  useEffect(() => {
    if (!user || appliedFor.current === user.id) return
    appliedFor.current = user.id
    const theme = themeSchema.safeParse(user.theme)
    if (theme.success) setTheme(theme.data)
    const locale = localeSchema.safeParse(user.locale)
    if (locale.success) setLanguage(locale.data)
  }, [user, setTheme, setLanguage])
}

export { useAccountPreferencesSyncViewModel }

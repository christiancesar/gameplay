import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import type { UserSettingsSection } from '@/modules/settings/model/settings.search'
import { displayNameOf } from '@/shared/lib/display-name'

/** The settings modal lives in the URL (`?settings=<section>`), so Hub and server screens share it. */
function useUserSettingsViewModel() {
  const { settings } = useSearch({ from: '/_authed' })
  const navigate = useNavigate()
  const { data: session } = useQuery(sessionQueryOptions)
  const user = session?.user

  const setSettings = (next: UserSettingsSection | undefined) =>
    navigate({ to: '.', search: (previous) => ({ ...previous, settings: next }), replace: true })

  return {
    open: settings !== undefined,
    section: settings ?? 'profile',
    userName: user ? displayNameOf(user) : '',
    onOpenChange: (open: boolean) => {
      if (!open) void setSettings(undefined)
    },
    // Switching sections is not a navigation worth a history entry.
    onSectionChange: (section: UserSettingsSection) => void setSettings(section),
  }
}

export { useUserSettingsViewModel }

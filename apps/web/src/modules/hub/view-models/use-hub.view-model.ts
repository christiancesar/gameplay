import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { toHubServer, toHubUser } from '@/modules/hub/model/mappers/hub-view.mapper'
import { canCreateServer } from '@/modules/servers/model/rules/can-create-server'
import { serversListQueryOptions } from '@/modules/servers/model/services/servers.query'
import { useServerLimitStore } from '@/modules/servers/view-models/stores/server-limit.store'
import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** The View only knows light and dark; "system" resolves to what the OS prefers right now. */
function resolveTheme(theme: 'dark' | 'light' | 'system'): 'dark' | 'light' {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/** Hub header (profile, admin, settings, theme), the user's servers and the server limit. */
function useHubViewModel() {
  const navigate = useNavigate()
  const { data: session } = useQuery(sessionQueryOptions)
  const { data: servers, isPending: isLoadingServers } = useQuery(serversListQueryOptions)
  const refusedAtOwnedCount = useServerLimitStore((state) => state.refusedAtOwnedCount)
  const storedTheme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const theme = resolveTheme(storedTheme)
  const user = session?.user
  const ownedCount = (servers ?? []).filter((server) => server.role === 'owner').length
  const hubServers = useMemo(() => (servers ?? []).map(toHubServer), [servers])

  return {
    // The route guard guarantees a session; the fallback keeps the hook total.
    user: toHubUser(user ?? { name: '', email: '' }),
    isPlatformAdmin: user?.role === 'admin',
    servers: hubServers,
    isLoadingServers,
    canCreateServer: canCreateServer({
      ownedCount,
      limitOverride: user?.maxServersOverride ?? null,
      refusedAtOwnedCount,
    }),
    theme,
    onToggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    onOpenServer: (serverId: string) => void navigate({ to: '/servers/$serverId', params: { serverId } }),
    onOpenAdmin: () => void navigate({ to: '/admin' }),
    onOpenSettings: () => void navigate({ to: '.', search: (prev) => ({ ...prev, settings: 'profile' as const }) }),
  }
}

export { useHubViewModel }

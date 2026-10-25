import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { notificationsKeys } from '@/modules/notifications/model/services/notifications.keys'
import { findServerName, removalNoticeKey } from '@/modules/realtime/model/mappers/server-removed.mapper'
import { isOnServerPath } from '@/modules/realtime/model/rules/server-path'
import { realtime } from '@/modules/realtime/model/services/realtime.service'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'

/**
 * Bridge from socket events to the rest of the app (F13). Events only invalidate queries, show a
 * toast or move the user; REST stays the source of truth. Runs while the `_authed` layout is mounted.
 */
function useRealtimeEventsViewModel() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    const stops = [
      realtime.on('server:changed', ({ serverId }) => {
        void queryClient.invalidateQueries({ queryKey: serversKeys.detail(serverId) })
        void queryClient.invalidateQueries({ queryKey: serversKeys.list() })
      }),

      realtime.on('server:removed', async ({ serverId, reason }) => {
        // Read the name before the cache entries go away.
        const server =
          findServerName(
            serverId,
            queryClient.getQueryData(serversKeys.detail(serverId)),
            queryClient.getQueryData(serversKeys.list()),
          ) ?? t('realtime.unknownServer')
        toast(t(removalNoticeKey(reason), { server }))

        if (isOnServerPath(router.state.location.pathname, serverId)) {
          await navigate({ to: '/', replace: true })
        }
        // The server is gone for this user: refetching its detail would only answer 403 or 404.
        queryClient.removeQueries({ queryKey: serversKeys.detail(serverId) })
        void queryClient.invalidateQueries({ queryKey: serversKeys.list() })
        void queryClient.invalidateQueries({ queryKey: serversKeys.myLimits() })
      }),

      realtime.on('session:revoked', async () => {
        realtime.disconnect()
        queryClient.clear()
        toast.error(t('notices.sessionEnded'))
        await navigate({ to: '/sign-in', replace: true })
      }),

      realtime.on('notification:new', () => {
        void queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
      }),
    ]
    return () => stops.forEach((stop) => stop())
  }, [queryClient, navigate, router, t])
}

export { useRealtimeEventsViewModel }

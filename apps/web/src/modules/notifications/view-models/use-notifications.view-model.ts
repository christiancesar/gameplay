import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import type { Notification } from '@gameplay/contracts'

import { toHubNotification } from '@/modules/notifications/model/mappers/notification.mapper'
import { notificationsKeys } from '@/modules/notifications/model/services/notifications.keys'
import { notificationsListQueryOptions } from '@/modules/notifications/model/services/notifications.query'
import {
  dismissAllNotifications,
  dismissNotification,
} from '@/modules/notifications/model/services/notifications.service'

/** Hub notification panel: list, dismiss one, dismiss all, open the server of an approval. */
function useNotificationsViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useQuery(notificationsListQueryOptions)
  const notifications = useMemo(() => (data ?? []).map(toHubNotification), [data])

  // The notice leaves the list right away; a failure refetches the real one.
  const removeFromCache = async (shouldRemove: (notification: Notification) => boolean) => {
    await queryClient.cancelQueries({ queryKey: notificationsKeys.list() })
    queryClient.setQueryData<Notification[]>(notificationsKeys.list(), (current) =>
      (current ?? []).filter((notification) => !shouldRemove(notification)),
    )
  }
  const refetch = () => queryClient.invalidateQueries({ queryKey: notificationsKeys.list() })

  const dismissOne = useMutation({
    mutationFn: dismissNotification,
    onMutate: (id: string) => removeFromCache((notification) => notification.id === id),
    onError: refetch,
  })
  const dismissAll = useMutation({
    mutationFn: dismissAllNotifications,
    onMutate: () => removeFromCache(() => true),
    onError: refetch,
  })

  return {
    notifications,
    onDismiss: (id: string) => dismissOne.mutate(id),
    onClearAll: () => dismissAll.mutate(),
    // Monitor detection is not stored by the API; the browser notices arrive with FE-12.
    onAllowMonitors: () => undefined,
    onOpenServer: (serverId: string) => void navigate({ to: '/servers/$serverId', params: { serverId } }),
  }
}

export { useNotificationsViewModel }

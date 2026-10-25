import { createFileRoute } from '@tanstack/react-router'

import { HubScreen } from '@/modules/hub/screens/hub.screen'
import { notificationsListQueryOptions } from '@/modules/notifications/model/services/notifications.query'
import { serversListQueryOptions } from '@/modules/servers/model/services/servers.query'

export const Route = createFileRoute('/_authed/')({
  // Fire and forget: the Hub shows skeletons while the lists load, and a failed prefetch must not block the route.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(serversListQueryOptions)
    void context.queryClient.prefetchQuery(notificationsListQueryOptions)
  },
  component: HubScreen,
})

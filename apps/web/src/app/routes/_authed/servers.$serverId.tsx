import { createFileRoute } from '@tanstack/react-router'

import { serverSearchSchema } from '@/modules/servers/model/server.search'
import { serverDetailQueryOptions } from '@/modules/servers/model/services/servers.query'
import { ServerScreen } from '@/modules/servers/screens/server.screen'

export const Route = createFileRoute('/_authed/servers/$serverId')({
  validateSearch: serverSearchSchema,
  // Fire and forget: the screen waits for the detail itself, and a 403 or 404 is handled there.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(serverDetailQueryOptions(params.serverId))
  },
  component: ServerScreen,
})

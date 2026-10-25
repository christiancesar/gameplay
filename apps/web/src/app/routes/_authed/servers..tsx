import { createFileRoute } from '@tanstack/react-router'

import { serverSearchSchema } from '@/modules/servers/model/server.search'
import { PendingScreen } from '@/app/pending.screen'

export const Route = createFileRoute('/_authed/servers/')({
  validateSearch: serverSearchSchema,
  component: PendingScreen,
})

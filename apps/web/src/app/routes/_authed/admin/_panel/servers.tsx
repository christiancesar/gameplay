import { createFileRoute } from '@tanstack/react-router'

import { adminServersSearchSchema } from '@/modules/admin/model/admin-servers.search'
import { AdminServersScreen } from '@/modules/admin/screens/admin-servers.screen'

export const Route = createFileRoute('/_authed/admin/_panel/servers')({
  validateSearch: adminServersSearchSchema,
  component: AdminServersScreen,
})

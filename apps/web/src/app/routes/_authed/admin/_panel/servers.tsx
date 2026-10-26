import { createFileRoute } from '@tanstack/react-router'

import { AdminServersScreen } from '@/modules/admin/screens/admin-servers.screen'

export const Route = createFileRoute('/_authed/admin/_panel/servers')({
  component: AdminServersScreen,
})

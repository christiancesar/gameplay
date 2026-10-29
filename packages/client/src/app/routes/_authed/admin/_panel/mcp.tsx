import { createFileRoute } from '@tanstack/react-router'

import { AdminMcpScreen } from '@/modules/admin/screens/admin-mcp.screen'

export const Route = createFileRoute('/_authed/admin/_panel/mcp')({
  component: AdminMcpScreen,
})

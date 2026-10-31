import { createFileRoute } from '@tanstack/react-router'

import { AdminPublicMcpScreen } from '@/modules/admin/screens/admin-public-mcp.screen'

export const Route = createFileRoute('/_authed/admin/_panel/public/mcp')({
  component: AdminPublicMcpScreen,
})

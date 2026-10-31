import { createFileRoute } from '@tanstack/react-router'

import { AdminPublicPanelScreen } from '@/modules/admin/screens/admin-public-panel.screen'

export const Route = createFileRoute('/_authed/admin/_panel/public')({
  component: AdminPublicPanelScreen,
})

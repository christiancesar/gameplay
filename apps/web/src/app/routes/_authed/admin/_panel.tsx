import { createFileRoute } from '@tanstack/react-router'

import { AdminPanelScreen } from '@/modules/admin/screens/admin-panel.screen'

export const Route = createFileRoute('/_authed/admin/_panel')({
  component: AdminPanelScreen,
})

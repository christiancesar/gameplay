import { createFileRoute } from '@tanstack/react-router'

import { AdminLimitsScreen } from '@/modules/admin/screens/admin-limits.screen'

export const Route = createFileRoute('/_authed/admin/_panel/limits')({
  component: AdminLimitsScreen,
})

import { createFileRoute } from '@tanstack/react-router'

import { AdminUsersScreen } from '@/modules/admin/screens/admin-users.screen'

export const Route = createFileRoute('/_authed/admin/_panel/users')({
  component: AdminUsersScreen,
})

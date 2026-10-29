import { createFileRoute } from '@tanstack/react-router'

import { AdminDevelopmentScreen } from '@/modules/admin/screens/admin-development.screen'

export const Route = createFileRoute('/_authed/admin/_panel/development')({
  component: AdminDevelopmentScreen,
})

import { createFileRoute } from '@tanstack/react-router'

import { AdminMediaScreen } from '@/modules/admin/screens/admin-media.screen'

export const Route = createFileRoute('/_authed/admin/_panel/media')({
  component: AdminMediaScreen,
})

import { createFileRoute } from '@tanstack/react-router'

import { AdminKeysScreen } from '@/modules/admin/screens/admin-keys.screen'

export const Route = createFileRoute('/_authed/admin/_panel/keys')({
  component: AdminKeysScreen,
})

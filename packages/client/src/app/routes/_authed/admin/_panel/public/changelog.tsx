import { createFileRoute } from '@tanstack/react-router'

import { AdminPublicChangelogScreen } from '@/modules/admin/screens/admin-public-changelog.screen'

export const Route = createFileRoute('/_authed/admin/_panel/public/changelog')({
  component: AdminPublicChangelogScreen,
})

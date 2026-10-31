import { createFileRoute } from '@tanstack/react-router'

import { AdminPublicRoadmapScreen } from '@/modules/admin/screens/admin-public-roadmap.screen'

export const Route = createFileRoute('/_authed/admin/_panel/public/roadmap')({
  component: AdminPublicRoadmapScreen,
})

import { createFileRoute } from '@tanstack/react-router'

import { AdminAnnouncementsScreen } from '@/modules/admin/screens/admin-announcements.screen'

export const Route = createFileRoute('/_authed/admin/_panel/announcements')({
  component: AdminAnnouncementsScreen,
})

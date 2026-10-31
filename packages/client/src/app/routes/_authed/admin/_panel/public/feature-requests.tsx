import { createFileRoute } from '@tanstack/react-router'

import { AdminPublicFeatureRequestsScreen } from '@/modules/admin/screens/admin-public-feature-requests.screen'

export const Route = createFileRoute('/_authed/admin/_panel/public/feature-requests')({
  component: AdminPublicFeatureRequestsScreen,
})

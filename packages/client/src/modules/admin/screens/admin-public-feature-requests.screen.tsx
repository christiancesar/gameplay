import { useAdminPublicFeatureRequestsViewModel } from '@/modules/admin/view-models/use-admin-public-feature-requests.view-model'
import { PublicFeatureRequestsTabView } from '@/modules/admin/views/public-feature-requests-tab.view'

function AdminPublicFeatureRequestsScreen() {
  return <PublicFeatureRequestsTabView {...useAdminPublicFeatureRequestsViewModel()} />
}

export { AdminPublicFeatureRequestsScreen }

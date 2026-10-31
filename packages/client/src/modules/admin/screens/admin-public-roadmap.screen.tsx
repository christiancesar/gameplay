import { useAdminPublicRoadmapViewModel } from '@/modules/admin/view-models/use-admin-public-roadmap.view-model'
import { PublicRoadmapTabView } from '@/modules/admin/views/public-roadmap-tab.view'

function AdminPublicRoadmapScreen() {
  return <PublicRoadmapTabView {...useAdminPublicRoadmapViewModel()} />
}

export { AdminPublicRoadmapScreen }

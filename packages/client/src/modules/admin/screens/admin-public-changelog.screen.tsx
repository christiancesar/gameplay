import { useAdminPublicChangelogViewModel } from '@/modules/admin/view-models/use-admin-public-changelog.view-model'
import { PublicChangelogTabView } from '@/modules/admin/views/public-changelog-tab.view'

function AdminPublicChangelogScreen() {
  return <PublicChangelogTabView {...useAdminPublicChangelogViewModel()} />
}

export { AdminPublicChangelogScreen }

import { useAdminDevelopmentViewModel } from '@/modules/admin/view-models/use-admin-development.view-model'
import { DevelopmentTabView } from '@/modules/admin/views/development-tab.view'

export function AdminDevelopmentScreen() {
  return <DevelopmentTabView {...useAdminDevelopmentViewModel()} />
}

import { useAdminLimitsViewModel } from '@/modules/admin/view-models/use-admin-limits.view-model'
import { LimitsTabView } from '@/modules/admin/views/limits-tab.view'

export function AdminLimitsScreen() {
  return <LimitsTabView {...useAdminLimitsViewModel()} />
}

import { useAdminKeysViewModel } from '@/modules/admin/view-models/use-admin-keys.view-model'
import { KeysTabView } from '@/modules/admin/views/keys-tab.view'

export function AdminKeysScreen() {
  return <KeysTabView {...useAdminKeysViewModel()} />
}

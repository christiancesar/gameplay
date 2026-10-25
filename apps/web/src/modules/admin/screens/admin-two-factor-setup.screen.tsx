import { useAdminTwoFactorSetupViewModel } from '@/modules/admin/view-models/use-admin-two-factor-setup.view-model'
import { TwoFactorSetupView } from '@/modules/admin/views/two-factor-setup.view'

export function AdminTwoFactorSetupScreen() {
  return <TwoFactorSetupView {...useAdminTwoFactorSetupViewModel()} />
}

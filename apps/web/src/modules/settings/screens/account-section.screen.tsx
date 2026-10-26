import { useSignOutViewModel } from '@/modules/auth/view-models/use-sign-out.view-model'
import { AccountSectionView } from '@/modules/settings/views/account-section.view'

export function AccountSectionScreen() {
  const { isSigningOut, signOut } = useSignOutViewModel()
  return <AccountSectionView isSigningOut={isSigningOut} onSignOut={signOut} />
}

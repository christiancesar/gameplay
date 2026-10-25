import { ProfileSectionView } from '@/modules/settings/views/profile-section.view'
import { useProfileSettingsViewModel } from '@/modules/settings/view-models/use-profile-settings.view-model'

export function ProfileSectionScreen() {
  const { formKey, ...profile } = useProfileSettingsViewModel()
  return <ProfileSectionView key={formKey} {...profile} />
}

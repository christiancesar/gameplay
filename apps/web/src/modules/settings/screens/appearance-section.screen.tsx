import { AppearanceSectionView } from '@/modules/settings/views/appearance-section.view'
import { useAppearanceSettingsViewModel } from '@/modules/settings/view-models/use-appearance-settings.view-model'

export function AppearanceSectionScreen() {
  return <AppearanceSectionView {...useAppearanceSettingsViewModel()} />
}

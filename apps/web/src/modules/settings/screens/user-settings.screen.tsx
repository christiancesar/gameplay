import type { ComponentType } from 'react'

import type { UserSettingsSection } from '@/modules/settings/model/user-settings-sections.constants'
import { AccountSectionScreen } from '@/modules/settings/screens/account-section.screen'
import { AppearanceSectionScreen } from '@/modules/settings/screens/appearance-section.screen'
import { AudioSectionScreen } from '@/modules/settings/screens/audio-section.screen'
import { HardwareSectionScreen } from '@/modules/settings/screens/hardware-section.screen'
import { ProfileSectionScreen } from '@/modules/settings/screens/profile-section.screen'
import { useUserSettingsViewModel } from '@/modules/settings/view-models/use-user-settings.view-model'
import { UserSettingsDialogView } from '@/modules/settings/views/user-settings-dialog.view'

const SECTION_SCREENS: Record<UserSettingsSection, ComponentType> = {
  profile: ProfileSectionScreen,
  audio: AudioSectionScreen,
  appearance: AppearanceSectionScreen,
  hardware: HardwareSectionScreen,
  account: AccountSectionScreen,
}

/** The settings modal, opened by `?settings=<section>`. Only the open section runs its ViewModel. */
export function UserSettingsScreen() {
  const settings = useUserSettingsViewModel()
  const SectionScreen = SECTION_SCREENS[settings.section]

  return <UserSettingsDialogView {...settings}>{settings.open && <SectionScreen />}</UserSettingsDialogView>
}

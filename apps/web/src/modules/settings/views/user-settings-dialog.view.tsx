import { CpuIcon, LogOutIcon, PaletteIcon, UserIcon, Volume2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { USER_SETTINGS_SECTIONS, type UserSettingsSection } from '@/modules/settings/model/settings.search'
import { SectionDialog } from '@/shared/ui/section-dialog'

const ICONS = {
  profile: UserIcon,
  audio: Volume2Icon,
  appearance: PaletteIcon,
  hardware: CpuIcon,
  account: LogOutIcon,
} as const

type UserSettingsDialogViewProps = {
  open: boolean
  userName: string
  section: UserSettingsSection
  children: ReactNode
  onOpenChange: (open: boolean) => void
  onSectionChange: (section: UserSettingsSection) => void
}

function UserSettingsDialogView({ userName, section, ...props }: UserSettingsDialogViewProps) {
  const { t } = useTranslation()

  return (
    <SectionDialog
      {...props}
      title={userName}
      subtitle={t('settings.title')}
      current={section}
      sections={USER_SETTINGS_SECTIONS.map((id) => ({
        id,
        label: t(`settings.sections.${id}`),
        icon: ICONS[id],
        danger: id === 'account',
      }))}
    />
  )
}

export { USER_SETTINGS_SECTIONS, UserSettingsDialogView }
export type { UserSettingsDialogViewProps, UserSettingsSection }

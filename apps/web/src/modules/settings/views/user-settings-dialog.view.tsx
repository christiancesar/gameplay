import { CpuIcon, LogOutIcon, PaletteIcon, UserIcon, Volume2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionDialog } from '@/shared/ui/section-dialog'

const USER_SETTINGS_SECTIONS = ['profile', 'audio', 'appearance', 'hardware', 'account'] as const
type UserSettingsSection = (typeof USER_SETTINGS_SECTIONS)[number]

const ICONS = { profile: UserIcon, audio: Volume2Icon, appearance: PaletteIcon, hardware: CpuIcon, account: LogOutIcon } as const

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

import { AudioLinesIcon, DoorOpenIcon, InboxIcon, LinkIcon, SlidersHorizontalIcon, UsersIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SERVER_SETTINGS_SECTIONS,
  type ServerSettingsSection,
} from '@/modules/servers/model/server-settings-sections.constants'
import { SectionDialog } from '@/shared/ui/section-dialog'

const ICONS = {
  general: SlidersHorizontalIcon,
  invites: LinkIcon,
  requests: InboxIcon,
  members: UsersIcon,
  rooms: AudioLinesIcon,
  danger: DoorOpenIcon,
} as const

type ServerSettingsDialogViewProps = {
  open: boolean
  serverName: string
  section: ServerSettingsSection
  pendingRequests: number
  /** Conteúdo da seção ativa. */
  children: ReactNode
  onOpenChange: (open: boolean) => void
  onSectionChange: (section: ServerSettingsSection) => void
}

function ServerSettingsDialogView({ serverName, section, pendingRequests, ...props }: ServerSettingsDialogViewProps) {
  const { t } = useTranslation()

  return (
    <SectionDialog
      {...props}
      title={serverName}
      subtitle={t('serverSettings.title')}
      current={section}
      sections={SERVER_SETTINGS_SECTIONS.map((id) => ({
        id,
        label: t(`serverSettings.sections.${id}`),
        icon: ICONS[id],
        badge: id === 'requests' ? pendingRequests : undefined,
        danger: id === 'danger',
      }))}
    />
  )
}

export { SERVER_SETTINGS_SECTIONS, ServerSettingsDialogView }
export type { ServerSettingsDialogViewProps, ServerSettingsSection }

import { cn } from 'cn'
import { AudioLinesIcon, DoorOpenIcon, InboxIcon, LinkIcon, SlidersHorizontalIcon, UsersIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

const SERVER_SETTINGS_SECTIONS = ['general', 'invites', 'requests', 'members', 'rooms', 'danger'] as const
type ServerSettingsSection = (typeof SERVER_SETTINGS_SECTIONS)[number]

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

function ServerSettingsDialogView({
  open,
  serverName,
  section,
  pendingRequests,
  children,
  onOpenChange,
  onSectionChange,
}: ServerSettingsDialogViewProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(40rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl md:flex-row">
        <nav
          aria-label={t('serverSettings.title')}
          className="bg-muted/40 flex shrink-0 gap-1 overflow-x-auto border-b p-2 md:w-52 md:flex-col md:border-r md:border-b-0 md:p-3"
        >
          <DialogHeader className="hidden px-2 pt-1 pb-3 md:flex">
            <DialogTitle className="truncate">{serverName}</DialogTitle>
            <DialogDescription>{t('serverSettings.title')}</DialogDescription>
          </DialogHeader>
          {SERVER_SETTINGS_SECTIONS.map((item) => {
            const Icon = ICONS[item]
            return (
              <button
                key={item}
                type="button"
                aria-current={item === section ? 'page' : undefined}
                onClick={() => onSectionChange(item)}
                className={cn(
                  'hover:bg-accent focus-visible:ring-ring/50 flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm outline-none focus-visible:ring-3',
                  item === section && 'bg-accent font-medium',
                  item === 'danger' && 'text-destructive md:mt-auto',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="flex-1">{t(`serverSettings.sections.${item}`)}</span>
                {item === 'requests' && pendingRequests > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                    {pendingRequests}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <section className="min-h-0 flex-1 overflow-y-auto p-6">
          <h2 className="mb-5 text-lg font-medium">{t(`serverSettings.sections.${section}`)}</h2>
          {children}
        </section>
      </DialogContent>
    </Dialog>
  )
}

export { SERVER_SETTINGS_SECTIONS, ServerSettingsDialogView }
export type { ServerSettingsDialogViewProps, ServerSettingsSection }

import { HeadphoneOffIcon, HeadphonesIcon, MicIcon, MicOffIcon, PhoneOffIcon, SettingsIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar'
import { UserAvatar } from '@/shared/ui/user-avatar'

type UserCardViewProps = {
  user: { name: string; email: string; avatarUrl?: string }
  inRoom: boolean
  isMuted: boolean
  isDeafened: boolean
  /** Painel de transmissão (F9), mostrado só dentro de uma sala e com a sidebar aberta. */
  sharePanel?: ReactNode
  /** Abre as configurações do usuário (F11). */
  onOpenSettings: () => void
  onToggleMute: () => void
  onToggleDeafen: () => void
  onLeaveRoom: () => void
}

/** Rodapé da sidebar do servidor: transmissão, controles de voz e o usuário. Com a sidebar recolhida, os controles empilham. */
function UserCardView({
  user,
  inRoom,
  isMuted,
  isDeafened,
  sharePanel,
  onOpenSettings,
  onToggleMute,
  onToggleDeafen,
  onLeaveRoom,
}: UserCardViewProps) {
  const { t } = useTranslation()

  return (
    <section aria-label={user.name} className="flex flex-col gap-2">
      {inRoom && sharePanel && <div className="group-data-[collapsible=icon]:hidden">{sharePanel}</div>}

      {inRoom && (
        <SidebarMenu className="flex-row group-data-[collapsible=icon]:flex-col">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isMuted ? t('voice.unmute') : t('voice.mute')}
              aria-label={isMuted ? t('voice.unmute') : t('voice.mute')}
              aria-pressed={isMuted}
              onClick={onToggleMute}
              className="size-8 justify-center p-0"
            >
              {isMuted ? <MicOffIcon className="text-red-500" /> : <MicIcon />}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isDeafened ? t('voice.undeafen') : t('voice.deafen')}
              aria-label={isDeafened ? t('voice.undeafen') : t('voice.deafen')}
              aria-pressed={isDeafened}
              onClick={onToggleDeafen}
              className="size-8 justify-center p-0"
            >
              {isDeafened ? <HeadphoneOffIcon className="text-red-500" /> : <HeadphonesIcon />}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="ml-auto group-data-[collapsible=icon]:ml-0">
            <SidebarMenuButton
              tooltip={t('voice.leaveRoom')}
              aria-label={t('voice.leaveRoom')}
              onClick={onLeaveRoom}
              className="size-8 justify-center bg-red-600 p-0 text-white hover:bg-red-700 hover:text-white active:bg-red-700 active:text-white"
            >
              <PhoneOffIcon />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )}

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            tooltip={t('common.settings')}
            aria-label={`${t('common.settings')}: ${user.name}`}
            onClick={onOpenSettings}
            className="group-data-[collapsible=icon]:p-0!"
          >
            <UserAvatar name={user.name} imageUrl={user.avatarUrl} className="size-8 rounded-md" />
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">{user.email}</span>
            </span>
            <SettingsIcon className="text-muted-foreground" aria-hidden />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </section>
  )
}

export { UserCardView }
export type { UserCardViewProps }

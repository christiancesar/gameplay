import { HeadphoneOffIcon, HeadphonesIcon, MicIcon, MicOffIcon, PhoneOffIcon, SettingsIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@/shared/ui/icon-button'
import { UserAvatar } from '@/shared/ui/user-avatar'

type UserCardViewProps = {
  user: { name: string; email: string; avatarUrl?: string }
  inRoom: boolean
  isMuted: boolean
  isDeafened: boolean
  /** Painel de transmissão (F9), mostrado só dentro de uma sala. */
  sharePanel?: ReactNode
  /** Abre as configurações do usuário (F11). */
  onOpenSettings: () => void
  onToggleMute: () => void
  onToggleDeafen: () => void
  onLeaveRoom: () => void
}

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
    <section aria-label={user.name} className="bg-card text-card-foreground flex flex-col gap-3 rounded-xl border p-3">
      {inRoom && sharePanel}

      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        </div>
        {!inRoom && <IconButton label={t('common.settings')} icon={<SettingsIcon />} onClick={onOpenSettings} />}
      </div>

      {inRoom && (
        <div className="flex items-center gap-1">
          <IconButton
            label={isMuted ? t('voice.unmute') : t('voice.mute')}
            icon={isMuted ? <MicOffIcon className="text-red-500" /> : <MicIcon />}
            aria-pressed={isMuted}
            onClick={onToggleMute}
          />
          <IconButton
            label={isDeafened ? t('voice.undeafen') : t('voice.deafen')}
            icon={isDeafened ? <HeadphoneOffIcon className="text-red-500" /> : <HeadphonesIcon />}
            aria-pressed={isDeafened}
            onClick={onToggleDeafen}
          />
          <IconButton label={t('common.settings')} icon={<SettingsIcon />} onClick={onOpenSettings} />
          <IconButton label={t('voice.leaveRoom')} icon={<PhoneOffIcon />} variant="danger" className="ml-auto" onClick={onLeaveRoom} />
        </div>
      )}
    </section>
  )
}

export { UserCardView }
export type { UserCardViewProps }

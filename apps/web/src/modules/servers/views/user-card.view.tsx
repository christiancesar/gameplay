import { HeadphoneOffIcon, HeadphonesIcon, LogOutIcon, MicIcon, MicOffIcon, PhoneOffIcon, SettingsIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { IconButton } from '@/shared/ui/icon-button'
import { UserAvatar } from '@/shared/ui/user-avatar'

type ServerRole = 'owner' | 'admin' | 'member'

type UserCardViewProps = {
  user: { name: string; email: string; avatarUrl?: string }
  serverName: string
  role: ServerRole
  pendingRequests: number
  inRoom: boolean
  isMuted: boolean
  isDeafened: boolean
  /** Painel de transmissão (F9), mostrado só dentro de uma sala. */
  sharePanel?: ReactNode
  onOpenServerSettings: () => void
  onLeaveServer: () => void
  onToggleMute: () => void
  onToggleDeafen: () => void
  onLeaveRoom: () => void
}

function UserCardView({
  user,
  serverName,
  role,
  pendingRequests,
  inRoom,
  isMuted,
  isDeafened,
  sharePanel,
  onOpenServerSettings,
  onLeaveServer,
  onToggleMute,
  onToggleDeafen,
  onLeaveRoom,
}: UserCardViewProps) {
  const { t } = useTranslation()
  const canManage = role !== 'member'

  return (
    <section aria-label={user.name} className="bg-card text-card-foreground flex flex-col gap-3 rounded-xl border p-3">
      {inRoom && sharePanel}

      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {inRoom && (
          <>
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
          </>
        )}

        {canManage ? (
          <IconButton
            label={
              pendingRequests > 0
                ? `${t('server.serverSettings')}, ${t('server.pendingRequests', { count: pendingRequests })}`
                : t('server.serverSettings')
            }
            icon={<SettingsIcon />}
            onClick={onOpenServerSettings}
            badge={
              pendingRequests > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] leading-none font-semibold text-white"
                >
                  {pendingRequests > 9 ? '9+' : pendingRequests}
                </span>
              )
            }
          />
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <IconButton label={t('server.leaveServer')} icon={<LogOutIcon />} />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('server.leaveServerTitle', { server: serverName })}</AlertDialogTitle>
                <AlertDialogDescription>{t('server.leaveServerDescription')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onLeaveServer}>
                  {t('server.leaveServerConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {inRoom && (
          <IconButton
            label={t('voice.leaveRoom')}
            icon={<PhoneOffIcon />}
            variant="danger"
            className="ml-auto"
            onClick={onLeaveRoom}
          />
        )}
      </div>
    </section>
  )
}

export { UserCardView }
export type { ServerRole, UserCardViewProps }

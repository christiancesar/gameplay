import { cn } from 'cn'
import { AudioLinesIcon, RadioIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ParticipantStatusView } from '@/modules/rooms/views/participant-status.view'
import { BrandLogo } from '@/shared/ui/brand-logo'
import { ServerIcon } from '@/shared/ui/server-icon'
import { UserAvatar } from '@/shared/ui/user-avatar'

type SidebarParticipant = {
  id: string
  name: string
  avatarUrl?: string
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  isLive: boolean
}

type SidebarRoom = {
  id: string
  name: string
  participants: readonly SidebarParticipant[]
}

type ServerSidebarViewProps = {
  server: { name: string; iconUrl?: string; ownerName: string }
  rooms: readonly SidebarRoom[]
  currentRoomId?: string
  /** Card do usuário, renderizado embaixo do painel. */
  userCard: ReactNode
  onSelectRoom: (roomId: string) => void
  onBackToHub: () => void
}

function ServerSidebarView({ server, rooms, currentRoomId, userCard, onSelectRoom, onBackToHub }: ServerSidebarViewProps) {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-3">
      <nav className="bg-card text-card-foreground flex min-h-0 flex-1 flex-col gap-5 rounded-xl border p-4">
        <button
          type="button"
          onClick={onBackToHub}
          aria-label={t('common.backToHub')}
          className="focus-visible:ring-ring/50 mx-auto rounded-md outline-none focus-visible:ring-3"
        >
          <BrandLogo className="w-24" />
        </button>

        <div className="bg-muted flex items-center gap-3 rounded-md px-3 py-2.5">
          <ServerIcon name={server.name} imageUrl={server.iconUrl} />
          <div className="min-w-0">
            <h2 className="truncate font-medium">{server.name}</h2>
            <p className="text-muted-foreground truncate text-xs">{t('server.ownedBy', { name: server.ownerName })}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <AudioLinesIcon className="size-4" aria-hidden />
            {t('server.rooms')}
          </h3>
          {rooms.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('server.noRooms')}</p>
          ) : (
            <ul className="-mr-2 flex flex-col gap-3 overflow-y-auto pr-2">
              {rooms.map((room) => {
                const isCurrent = room.id === currentRoomId
                return (
                  <li key={room.id} className={cn('bg-muted rounded-md', isCurrent && 'ring-foreground/30 ring-1')}>
                    <button
                      type="button"
                      onClick={() => onSelectRoom(room.id)}
                      aria-current={isCurrent ? 'true' : undefined}
                      aria-label={isCurrent ? `${room.name}, ${t('server.youAreHere')}` : t('server.joinRoom', { room: room.name })}
                      className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center justify-center gap-2 rounded-md px-3 py-3 font-medium outline-none focus-visible:ring-3"
                    >
                      <AudioLinesIcon className="size-5" aria-hidden />
                      {room.name}
                    </button>
                    {room.participants.length > 0 && (
                      <ul className="flex flex-col gap-1.5 px-2 pb-2">
                        {room.participants.map((participant) => (
                          <li key={participant.id} className="bg-card flex items-center gap-2 rounded-md px-2.5 py-2 text-sm">
                            <UserAvatar
                              name={participant.name}
                              imageUrl={participant.avatarUrl}
                              size="sm"
                              className={cn(participant.isSpeaking && 'ring-2 ring-emerald-500')}
                            />
                            <span className="min-w-0 flex-1 truncate">{participant.name}</span>
                            {participant.isLive && (
                              <RadioIcon className="size-3.5 text-red-500" role="img" aria-label={t('share.live')} />
                            )}
                            <ParticipantStatusView isMuted={participant.isMuted} isDeafened={participant.isDeafened} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </nav>
      {userCard}
    </aside>
  )
}

export { ServerSidebarView }
export type { ServerSidebarViewProps, SidebarParticipant, SidebarRoom }

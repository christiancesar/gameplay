import { useTranslation } from 'react-i18next'

import { RoomStageView } from '@/modules/rooms/views/room-stage.view'
import { SharePanelView } from '@/modules/screen-share/views/share-panel.view'
import { ServerScreenView } from '@/modules/servers/views/server-screen.view'
import { MembersPresenceView } from '@/modules/servers/views/members-presence.view'
import { ServerSidebarView } from '@/modules/servers/views/server-sidebar.view'
import { UserCardView } from '@/modules/servers/views/user-card.view'

import { HOME_DEMO_MEMBERS, HOME_DEMO_ROOMS, HOME_DEMO_SERVERS, HOME_DEMO_STAGE, HOME_DEMO_USER } from './demo-data'

const noop = () => undefined

function ServerDemoView({ watching = false }: { watching?: boolean }) {
  const { t } = useTranslation()
  const main = watching ? (
    <div className="flex h-full items-center justify-center bg-black p-4">
      <div className="flex h-full w-full max-w-3xl flex-col justify-center gap-3 rounded-lg bg-[linear-gradient(135deg,#172033,#263b5b_45%,#0f766e)] p-6 text-white">
        <span className="text-xs font-semibold tracking-[0.18em] text-emerald-200 uppercase">
          {t('public.home.demo.streamLabel')}
        </span>
        <span className="text-2xl font-semibold">{t('public.home.demo.streamTitle')}</span>
        <span className="text-sm text-white/70">{t('public.home.demo.streamStats')}</span>
      </div>
    </div>
  ) : (
    <RoomStageView
      roomName="Room 01"
      participants={HOME_DEMO_STAGE}
      micDenied={false}
      onWatch={noop}
      onVolumeChange={noop}
    />
  )

  return (
    <ServerScreenView
      sidebar={
        <ServerSidebarView
          server={HOME_DEMO_SERVERS[0]}
          servers={HOME_DEMO_SERVERS}
          currentServerId={HOME_DEMO_SERVERS[0].id}
          role="owner"
          pendingRequests={0}
          rooms={HOME_DEMO_ROOMS}
          currentRoomId="room-01"
          userCard={
            <UserCardView
              user={HOME_DEMO_USER}
              inRoom
              isMuted={false}
              isDeafened={false}
              sharePanel={
                <SharePanelView state={{ status: 'idle' }} onStart={noop} onStop={noop} onOpenDetails={noop} />
              }
              onOpenSettings={noop}
              onToggleMute={noop}
              onToggleDeafen={noop}
              onLeaveRoom={noop}
            />
          }
          members={<MembersPresenceView members={HOME_DEMO_MEMBERS} />}
          onSelectRoom={noop}
          onBackToHub={noop}
          onSelectServer={noop}
          onConfirmSwitch={noop}
          onDismissSwitch={noop}
          onOpenServerSettings={noop}
          onLeaveServer={noop}
        />
      }
      main={main}
      isWatching={watching}
      isSidebarOpen
      onSidebarOpenChange={noop}
    />
  )
}

export { ServerDemoView }

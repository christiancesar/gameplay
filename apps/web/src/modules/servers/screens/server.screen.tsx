import { RoomStageView } from '@/modules/rooms/views/room-stage.view'
import { MembersPresenceView } from '@/modules/servers/views/members-presence.view'
import { ServerScreenView } from '@/modules/servers/views/server-screen.view'
import { ServerSidebarView } from '@/modules/servers/views/server-sidebar.view'
import { UserCardView } from '@/modules/servers/views/user-card.view'
import { useServerScreenViewModel } from '@/modules/servers/view-models/use-server-screen.view-model'

export function ServerScreen() {
  const { isLoading, sidebar, members, userCard, stage } = useServerScreenViewModel()

  // Nothing to draw before the detail arrives; a 403 or 404 leaves the screen from the ViewModel.
  if (isLoading) return <div className="bg-sidebar h-dvh" aria-busy />

  return (
    <ServerScreenView
      main={stage ? <RoomStageView {...stage} /> : undefined}
      sidebar={
        <ServerSidebarView
          {...sidebar}
          userCard={<UserCardView {...userCard} />}
          members={<MembersPresenceView members={members} />}
        />
      }
    />
  )
}

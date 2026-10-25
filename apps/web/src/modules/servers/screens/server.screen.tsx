import { RoomStageView } from '@/modules/rooms/views/room-stage.view'
import { MembersPresenceView } from '@/modules/servers/views/members-presence.view'
import { SharePreviewScreen } from '@/modules/screen-share/screens/share-preview.screen'
import { useSharePreviewViewModel } from '@/modules/screen-share/view-models/use-share-preview.view-model'
import { SharePanelScreen } from '@/modules/screen-share/screens/share-panel.screen'
import { StreamWatchScreen } from '@/modules/screen-share/screens/stream-watch.screen'
import { ServerScreenView } from '@/modules/servers/views/server-screen.view'
import { ServerSidebarView } from '@/modules/servers/views/server-sidebar.view'
import { UserCardView } from '@/modules/servers/views/user-card.view'
import { ServerSettingsScreen } from '@/modules/servers/screens/server-settings.screen'
import { useServerScreenViewModel } from '@/modules/servers/view-models/use-server-screen.view-model'

export function ServerScreen() {
  const sharing = useSharePreviewViewModel().visible
  const { isLoading, sidebar, members, userCard, stage, watch, viewerProfiles } = useServerScreenViewModel()

  // Nothing to draw before the detail arrives; a 403 or 404 leaves the screen from the ViewModel.
  if (isLoading) return <div className="bg-sidebar h-dvh" aria-busy />

  return (
    <>
      <ServerScreenView
        main={
          watch ? (
            <StreamWatchScreen {...watch} />
          ) : stage ? (
            <RoomStageView {...stage} preview={sharing ? <SharePreviewScreen /> : undefined} />
          ) : undefined
        }
        sidebar={
          <ServerSidebarView
            {...sidebar}
            userCard={<UserCardView {...userCard} sharePanel={<SharePanelScreen profiles={viewerProfiles} />} />}
            members={<MembersPresenceView members={members} />}
          />
        }
      />
      <ServerSettingsScreen />
    </>
  )
}

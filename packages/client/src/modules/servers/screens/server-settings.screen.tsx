import { ServerSettingsDangerScreen } from '@/modules/servers/screens/server-settings-danger.screen'
import { ServerSettingsGeneralScreen } from '@/modules/servers/screens/server-settings-general.screen'
import { ServerSettingsInvitesScreen } from '@/modules/servers/screens/server-settings-invites.screen'
import { ServerSettingsMembersScreen } from '@/modules/servers/screens/server-settings-members.screen'
import { ServerSettingsRequestsScreen } from '@/modules/servers/screens/server-settings-requests.screen'
import { ServerSettingsRoomsScreen } from '@/modules/servers/screens/server-settings-rooms.screen'
import { useServerSettingsViewModel } from '@/modules/servers/view-models/use-server-settings.view-model'
import { ServerSettingsDialogView } from '@/modules/servers/views/settings/server-settings-dialog.view'

/** Server settings modal. Self-contained: it reads the server and section from the route. */
export function ServerSettingsScreen() {
  const { serverId, section, open, serverName, pendingRequests, onOpenChange, onSectionChange } =
    useServerSettingsViewModel()

  if (!open || !section) return null

  // Only the open section is mounted, so only its ViewModel runs.
  const content = {
    general: <ServerSettingsGeneralScreen serverId={serverId} />,
    invites: <ServerSettingsInvitesScreen serverId={serverId} />,
    requests: <ServerSettingsRequestsScreen serverId={serverId} />,
    members: <ServerSettingsMembersScreen serverId={serverId} />,
    rooms: <ServerSettingsRoomsScreen serverId={serverId} />,
    danger: <ServerSettingsDangerScreen serverId={serverId} />,
  }[section]

  return (
    <ServerSettingsDialogView
      open
      serverName={serverName}
      section={section}
      pendingRequests={pendingRequests}
      onOpenChange={onOpenChange}
      onSectionChange={onSectionChange}
    >
      {content}
    </ServerSettingsDialogView>
  )
}

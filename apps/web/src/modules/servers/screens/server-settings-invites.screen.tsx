import { useServerSettingsInvitesViewModel } from '@/modules/servers/view-models/use-server-settings-invites.view-model'
import { InvitesSectionView } from '@/modules/servers/views/settings/invites-section.view'

export function ServerSettingsInvitesScreen({ serverId }: { serverId: string }) {
  const { isLoading, ...props } = useServerSettingsInvitesViewModel(serverId)

  if (isLoading) return null

  return <InvitesSectionView {...props} />
}

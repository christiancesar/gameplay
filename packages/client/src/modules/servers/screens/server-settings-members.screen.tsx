import { useServerSettingsMembersViewModel } from '@/modules/servers/view-models/use-server-settings-members.view-model'
import { MembersSectionView } from '@/modules/servers/views/settings/members-section.view'

export function ServerSettingsMembersScreen({ serverId }: { serverId: string }) {
  const { isLoading, ...props } = useServerSettingsMembersViewModel(serverId)

  if (isLoading) return null

  return <MembersSectionView {...props} />
}

import { useServerSettingsRequestsViewModel } from '@/modules/servers/view-models/use-server-settings-requests.view-model'
import { RequestsSectionView } from '@/modules/servers/views/settings/requests-section.view'

export function ServerSettingsRequestsScreen({ serverId }: { serverId: string }) {
  const { isLoading, ...props } = useServerSettingsRequestsViewModel(serverId)

  if (isLoading) return null

  return <RequestsSectionView {...props} />
}

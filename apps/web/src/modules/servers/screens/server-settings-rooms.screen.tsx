import { useServerSettingsRoomsViewModel } from '@/modules/servers/view-models/use-server-settings-rooms.view-model'
import { RoomsSectionView } from '@/modules/servers/views/settings/rooms-section.view'

export function ServerSettingsRoomsScreen({ serverId }: { serverId: string }) {
  const { isLoading, ...props } = useServerSettingsRoomsViewModel(serverId)

  if (isLoading) return null

  return <RoomsSectionView {...props} />
}

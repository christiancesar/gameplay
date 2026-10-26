import { useServerSettingsDangerViewModel } from '@/modules/servers/view-models/use-server-settings-danger.view-model'
import { DangerSectionView } from '@/modules/servers/views/settings/danger-section.view'

export function ServerSettingsDangerScreen({ serverId }: { serverId: string }) {
  const { role, ...props } = useServerSettingsDangerViewModel(serverId)

  if (!role) return null

  return <DangerSectionView role={role} {...props} />
}

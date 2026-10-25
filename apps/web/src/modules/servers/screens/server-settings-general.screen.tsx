import { useServerSettingsGeneralViewModel } from '@/modules/servers/view-models/use-server-settings-general.view-model'
import { GeneralSectionView } from '@/modules/servers/views/settings/general-section.view'

export function ServerSettingsGeneralScreen({ serverId }: { serverId: string }) {
  const { isLoading, ...props } = useServerSettingsGeneralViewModel(serverId)

  if (isLoading) return null

  return <GeneralSectionView {...props} />
}

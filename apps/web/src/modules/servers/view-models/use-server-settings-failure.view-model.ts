import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { mapServerSettingsError } from '@/modules/servers/model/mappers/server-settings-error.mapper'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'

/**
 * Shared by every settings section: shows the toast for a failed call and, when the API said why
 * (limit reached, already decided, gone), refreshes the server so the screen stops showing stale data.
 */
function useServerSettingsFailureViewModel(serverId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return function onFailure(error: unknown) {
    const key = mapServerSettingsError(error)
    toast.error(t(`serverSettings.errors.${key}`))
    if (key !== 'unexpected') void queryClient.invalidateQueries({ queryKey: serversKeys.detail(serverId) })
  }
}

export { useServerSettingsFailureViewModel }

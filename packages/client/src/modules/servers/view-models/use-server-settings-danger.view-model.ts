import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { canManageServer } from '@/modules/servers/model/rules/can-manage-server'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { serverDetailQueryOptions } from '@/modules/servers/model/services/servers.query'
import { deleteServer, leaveServer } from '@/modules/servers/model/services/servers.service'

import { useServerSettingsFailureViewModel } from './use-server-settings-failure.view-model'

/** Settings > Leave or delete: an admin leaves, the owner deletes (the View asks for the typed name). */
function useServerSettingsDangerViewModel(serverId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const onFailure = useServerSettingsFailureViewModel(serverId)
  const { data: detail } = useQuery(serverDetailQueryOptions(serverId))

  const exit = useMutation({
    mutationFn: (action: 'leave' | 'delete') => (action === 'leave' ? leaveServer(serverId) : deleteServer(serverId)),
    onSuccess: async () => {
      await navigate({ to: '/hub', replace: true })
      queryClient.removeQueries({ queryKey: serversKeys.detail(serverId) })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: serversKeys.list() }),
        queryClient.invalidateQueries({ queryKey: serversKeys.myLimits() }),
      ])
    },
    onError: onFailure,
  })

  const role = detail?.role
  return {
    // A plain member never reaches this section (the shell closes the modal), so there is nothing to show.
    role: role !== undefined && canManageServer(role) ? role : undefined,
    serverName: detail?.name ?? '',
    isBusy: exit.isPending,
    onLeave: () => exit.mutate('leave'),
    onDelete: () => exit.mutate('delete'),
  }
}

export { useServerSettingsDangerViewModel }

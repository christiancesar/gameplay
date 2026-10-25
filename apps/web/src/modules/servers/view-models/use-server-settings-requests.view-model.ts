import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { toJoinRequestItems } from '@/modules/servers/model/mappers/settings-requests.mapper'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { joinRequestsQueryOptions, serverDetailQueryOptions } from '@/modules/servers/model/services/servers.query'
import { approveJoinRequest, declineJoinRequest } from '@/modules/servers/model/services/servers.service'

import { useServerSettingsFailureViewModel } from './use-server-settings-failure.view-model'

type Decision = { requestId: string; action: 'approve' | 'decline' }

/** Settings > Requests: approve or decline people waiting to join. */
function useServerSettingsRequestsViewModel(serverId: string) {
  const queryClient = useQueryClient()
  const onFailure = useServerSettingsFailureViewModel(serverId)
  const { data: detail } = useQuery(serverDetailQueryOptions(serverId))
  const { data: requests } = useQuery(joinRequestsQueryOptions(serverId))

  const items = useMemo(() => toJoinRequestItems(requests ?? []), [requests])

  const decide = useMutation({
    mutationFn: ({ requestId, action }: Decision) =>
      action === 'approve' ? approveJoinRequest(serverId, requestId) : declineJoinRequest(serverId, requestId),
    // The detail carries the counters (members, pending requests); the prefix also covers the lists.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serversKeys.detail(serverId) }),
    onError: onFailure,
  })

  return {
    isLoading: detail === undefined,
    autoApprove: detail?.autoApprove ?? false,
    requests: items,
    memberCount: detail?.memberCount ?? 0,
    memberLimit: detail?.limits.maxMembers ?? 0,
    busyRequestId: decide.isPending ? decide.variables.requestId : undefined,
    onApprove: (requestId: string) => decide.mutate({ requestId, action: 'approve' }),
    onDecline: (requestId: string) => decide.mutate({ requestId, action: 'decline' }),
  }
}

export { useServerSettingsRequestsViewModel }

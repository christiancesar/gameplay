import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { toMemberItems } from '@/modules/servers/model/mappers/settings-members.mapper'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { serverDetailQueryOptions, serverMembersQueryOptions } from '@/modules/servers/model/services/servers.query'
import { demoteMember, kickMember, promoteMember } from '@/modules/servers/model/services/servers.service'

import { useServerSettingsFailureViewModel } from './use-server-settings-failure.view-model'

type MemberAction = { userId: string; action: 'promote' | 'demote' | 'kick' }

const ACTIONS = { promote: promoteMember, demote: demoteMember, kick: kickMember } as const

/** Settings > Members: promote, demote and kick (the View asks for the kick confirmation). */
function useServerSettingsMembersViewModel(serverId: string) {
  const queryClient = useQueryClient()
  const onFailure = useServerSettingsFailureViewModel(serverId)
  const { data: session } = useQuery(sessionQueryOptions)
  const { data: detail } = useQuery(serverDetailQueryOptions(serverId))
  const { data: members } = useQuery(serverMembersQueryOptions(serverId))

  const items = useMemo(() => toMemberItems(members ?? [], session?.user.id), [members, session?.user.id])

  const act = useMutation({
    mutationFn: ({ userId, action }: MemberAction) => ACTIONS[action](serverId, userId),
    // Members and the counter live under the detail key.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serversKeys.detail(serverId) }),
    onError: onFailure,
  })

  return {
    isLoading: detail === undefined || members === undefined,
    members: items,
    memberLimit: detail?.limits.maxMembers ?? 0,
    onPromote: (userId: string) => act.mutate({ userId, action: 'promote' }),
    onDemote: (userId: string) => act.mutate({ userId, action: 'demote' }),
    onKick: (userId: string) => act.mutate({ userId, action: 'kick' }),
  }
}

export { useServerSettingsMembersViewModel }

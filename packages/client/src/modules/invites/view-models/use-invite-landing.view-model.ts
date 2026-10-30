import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { mapInviteStatus, mapJoinInviteError } from '@/modules/invites/model/mappers/invite-error.mapper'
import { inviteQueryOptions } from '@/modules/invites/model/services/invites.query'
import { joinByInvite } from '@/modules/invites/model/services/invites.service'
import { notificationsKeys } from '@/modules/notifications/model/services/notifications.keys'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import type { InviteLandingState } from '@/modules/invites/model/entities/invite-error'

/** F3: `/i/$code`, with or without a session. `state` is undefined while the invite loads. */
function useInviteLandingViewModel() {
  const { t } = useTranslation()
  const { code } = useParams({ from: '/i/$code' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const invite = useQuery(inviteQueryOptions(code))

  const join = useMutation({
    mutationFn: () => joinByInvite(code),
    onSuccess: async ({ serverId, result }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: serversKeys.list() }),
        queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
      ])
      if (result === 'pending') {
        toast.success(t('invite.requestSent'))
        await navigate({ to: '/hub' })
        return
      }
      await navigate({ to: '/servers/$serverId', params: { serverId } })
    },
  })

  const signedIn = Boolean(session)
  const resolved = invite.data

  function buildState(): InviteLandingState | undefined {
    if (join.error) return { status: 'error', error: mapJoinInviteError(join.error) }
    if (invite.isError) return { status: 'error', error: 'notFound' }
    if (!resolved) return undefined

    const server = resolved.server && {
      name: resolved.server.name,
      iconUrl: resolved.server.iconUrl ?? undefined,
      memberCount: resolved.server.memberCount,
      isFull: resolved.server.full,
    }
    // Members get in even if the invite has expired meanwhile.
    if (server && signedIn && resolved.alreadyMember) return { status: 'alreadyMember', server }
    const error = mapInviteStatus(resolved.status)
    if (error || !server) return { status: 'error', error: error ?? 'notFound' }
    return signedIn ? { status: 'confirm', server, isJoining: join.isPending } : { status: 'signedOut', server }
  }

  return {
    state: buildState(),
    onCreateAccount: () => void navigate({ to: '/sign-up', search: { invite: code } }),
    onSignIn: () => void navigate({ to: '/sign-in', search: { redirect: `/i/${code}` } }),
    onJoin: () => join.mutate(),
    onOpenServer: () => {
      if (resolved?.server) void navigate({ to: '/servers/$serverId', params: { serverId: resolved.server.id } })
    },
    // Without a session there is no Hub to go back to.
    onBackToHub: () => void navigate({ to: signedIn ? '/hub' : '/sign-in' }),
  }
}

export { useInviteLandingViewModel }

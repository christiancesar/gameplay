import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { toInviteItems } from '@/modules/servers/model/mappers/settings-invites.mapper'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { serverDetailQueryOptions, serverInvitesQueryOptions } from '@/modules/servers/model/services/servers.query'
import {
  createServerInvite,
  revokeServerInvite,
  setServerAutoApprove,
} from '@/modules/servers/model/services/servers.service'

import { useServerSettingsFailureViewModel } from './use-server-settings-failure.view-model'

const COPIED_FEEDBACK_MS = 2000

/** Settings > Invites: auto approval, single use invites (1 hour), copy, revoke and history. */
function useServerSettingsInvitesViewModel(serverId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onFailure = useServerSettingsFailureViewModel(serverId)
  const { data: detail } = useQuery(serverDetailQueryOptions(serverId))
  const { data: invites, dataUpdatedAt } = useQuery(serverInvitesQueryOptions(serverId))
  const [copiedCode, setCopiedCode] = useState<string>()

  useEffect(() => {
    if (!copiedCode) return
    const timer = setTimeout(() => setCopiedCode(undefined), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copiedCode])

  const items = useMemo(
    () => toInviteItems(invites ?? [], window.location.origin, dataUpdatedAt),
    [invites, dataUpdatedAt],
  )

  const refreshInvites = () => queryClient.invalidateQueries({ queryKey: serversKeys.invites(serverId) })

  const autoApprove = useMutation({
    mutationFn: (value: boolean) => setServerAutoApprove(serverId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serversKeys.detail(serverId) }),
    onError: onFailure,
  })
  const generate = useMutation({
    mutationFn: () => createServerInvite(serverId),
    onSuccess: refreshInvites,
    onError: onFailure,
  })
  const revoke = useMutation({
    mutationFn: (inviteId: string) => revokeServerInvite(serverId, inviteId),
    onSuccess: refreshInvites,
    onError: onFailure,
  })

  async function onCopy(code: string) {
    const link = items.find((item) => item.code === code)?.link
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiedCode(code)
    } catch {
      toast.error(t('serverSettings.errors.copyFailed'))
    }
  }

  return {
    isLoading: detail === undefined,
    // Shows the switch already flipped while the request is in flight.
    autoApprove: autoApprove.isPending ? autoApprove.variables : (detail?.autoApprove ?? false),
    invites: items,
    isGenerating: generate.isPending,
    memberCount: detail?.memberCount ?? 0,
    memberLimit: detail?.limits.maxMembers ?? 0,
    copiedCode,
    onAutoApproveChange: (value: boolean) => autoApprove.mutate(value),
    onGenerate: () => generate.mutate(),
    onCopy: (code: string) => void onCopy(code),
    onRevoke: (code: string) => {
      const inviteId = invites?.find((invite) => invite.code === code)?.id
      if (inviteId) revoke.mutate(inviteId)
    },
  }
}

export { useServerSettingsInvitesViewModel }

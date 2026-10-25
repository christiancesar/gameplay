import type { RegistrationInviteValidity } from '@gameplay/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { toRegistrationKeyItem } from '@/modules/admin/model/mappers/registration-key.mapper'
import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import { registrationInvitesQueryOptions } from '@/modules/admin/model/services/admin.query'
import { generateRegistrationInvite, revokeRegistrationInvite } from '@/modules/admin/model/services/admin.service'
import { copyText } from '@/modules/admin/model/services/browser.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'

const DEFAULT_VALIDITY: RegistrationInviteValidity = '7d'

/** `/admin/keys`: generate (the key is shown once), see who used each one, revoke. */
function useAdminKeysViewModel() {
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()
  const { data: invites } = useQuery(registrationInvitesQueryOptions)

  const [duration, setDuration] = useState<RegistrationInviteValidity>(DEFAULT_VALIDITY)
  const [newKey, setNewKey] = useState<string>()
  const [copied, setCopied] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.registrationInvites() })

  const generate = useMutation({
    mutationFn: generateRegistrationInvite,
    onSuccess: async ({ key }) => {
      setNewKey(key)
      setCopied(false)
      await refresh()
    },
    onError,
  })
  const revoke = useMutation({ mutationFn: revokeRegistrationInvite, onSuccess: refresh, onError })

  return {
    keys: (invites ?? []).map(toRegistrationKeyItem),
    duration,
    isGenerating: generate.isPending,
    newKey,
    newKeyCopied: copied,
    onDurationChange: setDuration,
    onGenerate: () => generate.mutate(duration),
    onCopyNewKey: () => {
      if (newKey) void copyText(newKey).then(() => setCopied(true))
    },
    onCloseNewKey: () => setNewKey(undefined),
    onRevoke: (keyId: string) => revoke.mutate(keyId),
  }
}

export { useAdminKeysViewModel }

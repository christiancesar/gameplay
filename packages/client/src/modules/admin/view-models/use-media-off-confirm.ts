import type { MediaNotice, MediaResource } from '@gameplay/contracts'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { mediaImpactQueryOptions } from '@/modules/admin/model/services/admin.query'

type Pending = { resources: MediaResource[]; apply: (notice?: MediaNotice) => void }

/**
 * Asks before turning media resources off: how many people it cuts off now, and an optional notice.
 * Changes that turn nothing off go straight through.
 */
function useMediaOffConfirm(serverId: string | null, isSaving: boolean) {
  const [pending, setPending] = useState<Pending>()
  const { data: impact } = useQuery({ ...mediaImpactQueryOptions(serverId), enabled: Boolean(pending) })

  return {
    request: (resources: MediaResource[], apply: (notice?: MediaNotice) => void) =>
      resources.length === 0 ? apply() : setPending({ resources, apply }),
    close: () => setPending(undefined),
    dialog: {
      open: Boolean(pending),
      resources: pending?.resources ?? [],
      scope: serverId ? ('server' as const) : ('global' as const),
      // People overlap between resources; the largest count is the floor of who is cut off.
      impact: impact && pending ? Math.max(...pending.resources.map((resource) => impact[resource])) : undefined,
      isSaving,
      onConfirm: (notice?: MediaNotice) => pending?.apply(notice),
      onCancel: () => setPending(undefined),
    },
  }
}

export { useMediaOffConfirm }

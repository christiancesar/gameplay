import { queryOptions } from '@tanstack/react-query'

import { invitesKeys } from './invites.keys'
import { resolveInvite } from './invites.service'

/** The invite state changes on its own (expiry, revocation), so it is never served stale. */
const inviteQueryOptions = (code: string) =>
  queryOptions({
    queryKey: invitesKeys.resolve(code),
    queryFn: () => resolveInvite(code),
    staleTime: 0,
    retry: false,
  })

export { inviteQueryOptions }

import type { ResolvedInvite } from '@gameplay/contracts'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { fakeHttp } from '@/shared/test/fake-http'
import { createQueryClientContext } from '@/shared/test/query-client-context'

/** QueryClient with the session cached and `GET /invites/:code` answering with `invite`. */
function createInvitesViewModelContext(session: object | null, invite: ResolvedInvite) {
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url.startsWith('/invites/')) return { data: invite }
    throw new Error(`unexpected GET ${url}`)
  })
  const context = createQueryClientContext()
  context.queryClient.setQueryData<object | null>([...sessionQueryOptions.queryKey], session)
  return context
}

export { createInvitesViewModelContext }

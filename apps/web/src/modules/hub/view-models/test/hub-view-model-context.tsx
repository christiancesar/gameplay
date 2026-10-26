import type { MyLimits, ServerSummary } from '@gameplay/contracts'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { createServersViewModelContext } from '@/modules/servers/view-models/test/servers-view-model-context'

/** QueryClient with a cached session and the given server list behind the fake http. */
function createHubViewModelContext(session: object, servers: ServerSummary[] = [], limits?: MyLimits) {
  const context = createServersViewModelContext(servers, limits)
  context.queryClient.setQueryData<object>([...sessionQueryOptions.queryKey], session)
  return context
}

export { createHubViewModelContext }

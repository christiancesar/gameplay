import { createQueryClientContext } from '@/shared/test/query-client-context'

import { sessionData } from './settings-seed'

/** QueryClient with the session already cached, as the `_authed` guard leaves it. */
function createSettingsViewModelContext(session: unknown = sessionData) {
  const context = createQueryClientContext()
  context.queryClient.setQueryData(['session'], session)
  return context
}

export { createSettingsViewModelContext }

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'

import { fakeAuthClient } from './fake-auth-client'

/** A QueryClient with a cached session, so specs can see it being refetched or cleared. */
function createAuthViewModelContext() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // The real app caches the session through ensureQueryData, which keeps its queryFn on the query.
  queryClient.setQueryDefaults(sessionQueryOptions.queryKey, {
    queryFn: async () => (await fakeAuthClient.getSession()).data,
  })
  queryClient.setQueryData(sessionQueryOptions.queryKey, null)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

export { createAuthViewModelContext }

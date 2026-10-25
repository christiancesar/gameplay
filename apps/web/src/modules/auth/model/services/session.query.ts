import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/lib/api-error'
import { authClient } from '@/shared/lib/auth-client'

/** Sessão atual (null sem login). Carregada uma vez e usada pelos guards das rotas. */
const sessionQueryOptions = queryOptions({
  queryKey: ['session'],
  queryFn: async () => {
    const { data, error } = await authClient.getSession()
    if (error) throw new ApiError({ code: error.code ?? 'UNKNOWN_ERROR', message: error.message ?? '' }, error.status)
    return data
  },
  staleTime: Infinity,
})

/**
 * Refetches the session even though no component observes it: the route guards read it
 * with `ensureQueryData`, which would serve the stale value otherwise.
 */
function refreshSession(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey, refetchType: 'all' })
}

export { refreshSession, sessionQueryOptions }

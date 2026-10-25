import { queryOptions } from '@tanstack/react-query'

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

export { sessionQueryOptions }

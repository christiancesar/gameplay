import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './api-error'

/** Não repete erro do cliente (4xx): a resposta não muda numa nova tentativa. */
function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status !== undefined && error.status < 500) return false
  return failureCount < 2
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
    },
  })
}

const queryClient = createQueryClient()

export { createQueryClient, queryClient }

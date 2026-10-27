import type { QueryClient } from '@tanstack/react-query'

export type RouterContext = {
  queryClient: QueryClient
}

export function createRouterContext(queryClient: QueryClient): RouterContext {
  return { queryClient }
}

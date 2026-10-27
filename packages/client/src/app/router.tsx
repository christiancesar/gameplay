import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './route-tree.gen'
import type { RouterContext } from './router-context'

export function createRouter(context: RouterContext) {
  return createTanStackRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}

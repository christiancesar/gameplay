import { createRootRouteWithContext } from '@tanstack/react-router'

import { RootLayout } from '../root-layout'
import type { RouterContext } from '../router-context'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

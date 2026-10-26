import { ErrorBoundary } from '@sentry/react'
import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { useRotatingFaviconViewModel } from '@/modules/browser-support/view-models/use-rotating-favicon.view-model'
import { ConnectionBannerScreen } from '@/modules/connection/screens/connection-banner.screen'
import { RootErrorFallback } from './root-error-fallback'

export function RootLayout() {
  useRotatingFaviconViewModel()
  return (
    <ErrorBoundary fallback={<RootErrorFallback />}>
      <ConnectionBannerScreen />
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </ErrorBoundary>
  )
}

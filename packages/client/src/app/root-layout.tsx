import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { ConnectionBannerScreen } from '@/modules/connection/screens/connection-banner.screen'
import { RootErrorFallback } from './root-error-fallback'
import { TelemetryErrorBoundary } from './telemetry-error-boundary'

export function RootLayout() {
  return (
    <TelemetryErrorBoundary fallback={<RootErrorFallback />}>
      <ConnectionBannerScreen />
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </TelemetryErrorBoundary>
  )
}

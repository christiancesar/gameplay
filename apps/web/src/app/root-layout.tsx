import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { ConnectionBannerScreen } from '@/modules/connection/screens/connection-banner.screen'

export function RootLayout() {
  return (
    <>
      <ConnectionBannerScreen />
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  )
}

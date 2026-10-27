import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/shared/ui/tooltip'
import { queryClient } from '@/shared/lib/query-client'
import { ThemeSync } from './theme-sync'
import { initFaro } from '@/shared/lib/faro'
import { initSentry } from '@/shared/lib/sentry'
import type { Platform } from '@/shared/platform/platform'
import { PlatformProvider } from '@/shared/platform/platform-provider'
import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { createRouter } from './router'
import { createRouterContext } from './router-context'

const router = createRouter(createRouterContext(queryClient))

let monitoringStarted = false

/** Needs the platform: the monitoring tunnels are paths of the server the app talks to. */
function startMonitoring(serverUrl: string) {
  if (monitoringStarted) return
  monitoringStarted = true
  initSentry(serverUrl)
  initFaro(router, serverUrl)
}

/** The front-end of every host. The web and the desktop app each mount it with their own platform. */
export function App({ platform }: { platform: Platform }) {
  // The controllers outside React read it from here; it does not change while the app runs.
  setCurrentPlatform(platform)
  startMonitoring(platform.server.baseUrl())
  return (
    <PlatformProvider platform={platform}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster richColors />
        </TooltipProvider>
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </PlatformProvider>
  )
}

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { useState } from 'react'
import { Toaster } from 'sonner'

import { ServerChoiceScreen } from '@/modules/server-choice/screens/server-choice.screen'

import { TooltipProvider } from '@/shared/ui/tooltip'
import { queryClient } from '@/shared/lib/query-client'
import { ThemeSync } from './theme-sync'
import { installTelemetry, telemetry } from '@/shared/lib/telemetry/current-telemetry'
import { createTelemetry } from '@/shared/lib/telemetry/create-telemetry'
import type { Platform } from '@/shared/platform/platform'
import { PlatformProvider } from '@/shared/platform/platform-provider'
import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { createRouter } from './router'
import { createRouterContext } from './router-context'

const router = createRouter(createRouterContext(queryClient))

let telemetryStarted = false

/** Needs the platform: the config comes from the host, and the tunnels are paths of the server the app talks to. */
function startTelemetry(platform: Platform) {
  if (telemetryStarted) return
  telemetryStarted = true
  installTelemetry(createTelemetry(platform.telemetry, platform.server.baseUrl(), router))
  // The route pattern (/servers/$serverId), never the URL: no ids in the view names.
  const setView = () => {
    const routeId = router.state.matches.at(-1)?.routeId
    if (routeId) telemetry.setView(routeId)
  }
  setView()
  router.subscribe('onResolved', setView)
}

/**
 * The front-end of every host. The web and the desktop app each mount it with their own platform. Where the
 * user picks the server (the desktop), nothing talks to the API until one is chosen.
 */
export function App({ platform }: { platform: Platform }) {
  // The controllers outside React read it from here; it does not change while the app runs.
  setCurrentPlatform(platform)
  const { chooser } = platform.server
  const [needsServer, setNeedsServer] = useState(() => chooser !== undefined && chooser.current() === null)
  // Not after the server is picked: the app reports to its own project, and the choice screen can fail too.
  startTelemetry(platform)

  return (
    <PlatformProvider platform={platform}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <TooltipProvider>
          {needsServer ? (
            <ServerChoiceScreen onChosen={() => setNeedsServer(false)} />
          ) : (
            <RouterProvider router={router} />
          )}
          <Toaster richColors />
        </TooltipProvider>
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </PlatformProvider>
  )
}

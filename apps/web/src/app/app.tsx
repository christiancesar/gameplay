import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/shared/ui/tooltip'
import { queryClient } from '@/shared/lib/query-client'
import { ThemeSync } from './theme-sync'
import { initSentry } from '@/shared/lib/sentry'
import { createRouter } from './router'
import { createRouterContext } from './router-context'

const router = createRouter(createRouterContext(queryClient))
initSentry(router)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster richColors />
      </TooltipProvider>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}

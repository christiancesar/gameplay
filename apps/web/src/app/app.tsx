import { useLayoutEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/shared/ui/tooltip'
import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'
import { queryClient } from '@/shared/lib/query-client'
import { createRouter } from './router'
import { createRouterContext } from './router-context'

const router = createRouter(createRouterContext(queryClient))

function ThemeSync() {
  const theme = useThemeStore((state) => state.theme)

  useLayoutEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  return null
}

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

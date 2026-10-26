import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'

export const Route = createFileRoute('/_guest')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (session) {
      throw redirect({ to: '/' })
    }
    return { session: null }
  },
  // Each auth View renders its own AuthLayoutView, so the layout is a bare Outlet.
  component: Outlet,
})

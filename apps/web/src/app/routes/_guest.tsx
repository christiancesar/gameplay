import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { GuestLayoutScreen } from '@/modules/auth/screens/guest-layout.screen'

export const Route = createFileRoute('/_guest')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (session) {
      throw redirect({ to: '/' })
    }
    return { session: null }
  },
  component: GuestLayoutScreen,
})

export const GuestLayoutOutlet = Outlet

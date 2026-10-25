import { createFileRoute, redirect } from '@tanstack/react-router'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { settingsSearchSchema } from '@/modules/settings/model/settings.search'
import { AuthedLayoutScreen } from '@/modules/auth/screens/authed-layout.screen'

export const Route = createFileRoute('/_authed')({
  validateSearch: settingsSearchSchema,
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
    return { session }
  },
  component: AuthedLayoutScreen,
})

import { createFileRoute } from '@tanstack/react-router'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { InviteLandingScreen } from '@/modules/invites/screens/invite-landing.screen'

export const Route = createFileRoute('/i/$code')({
  // Works with and without a session: it only warms the cache, never redirects.
  loader: ({ context }) => context.queryClient.query(sessionQueryOptions).catch(() => null),
  component: InviteLandingScreen,
})

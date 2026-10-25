import { createFileRoute } from '@tanstack/react-router'

import { signInSearchSchema } from '@/modules/auth/model/sign-in.search'
import { PendingScreen } from '@/app/pending.screen'

export const Route = createFileRoute('/_guest/sign-in')({
  validateSearch: signInSearchSchema,
  component: PendingScreen,
})

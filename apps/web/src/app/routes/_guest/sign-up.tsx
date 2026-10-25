import { createFileRoute } from '@tanstack/react-router'

import { signUpSearchSchema } from '@/modules/auth/model/sign-up.search'
import { PendingScreen } from '@/app/pending.screen'

export const Route = createFileRoute('/_guest/sign-up')({
  validateSearch: signUpSearchSchema,
  component: PendingScreen,
})

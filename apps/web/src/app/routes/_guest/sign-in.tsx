import { createFileRoute } from '@tanstack/react-router'

import { signInSearchSchema } from '@/modules/auth/model/sign-in.search'
import { SignInScreen } from '@/modules/auth/screens/sign-in.screen'

export const Route = createFileRoute('/_guest/sign-in')({
  validateSearch: signInSearchSchema,
  component: SignInScreen,
})

import { createFileRoute } from '@tanstack/react-router'

import { signUpSearchSchema } from '@/modules/auth/model/sign-up.search'
import { SignUpScreen } from '@/modules/auth/screens/sign-up.screen'

export const Route = createFileRoute('/_guest/sign-up')({
  validateSearch: signUpSearchSchema,
  component: SignUpScreen,
})

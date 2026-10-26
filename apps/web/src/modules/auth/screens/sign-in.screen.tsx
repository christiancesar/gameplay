import { useSearch } from '@tanstack/react-router'

import { CredentialsScreen } from '@/modules/auth/screens/credentials.screen'
import { RecoveryCodeScreen } from '@/modules/auth/screens/recovery-code.screen'
import { TwoFactorScreen } from '@/modules/auth/screens/two-factor.screen'

/** `/sign-in`: picks the step from the search params. */
export function SignInScreen() {
  const { step } = useSearch({ from: '/_guest/sign-in' })

  if (step === 'two-factor') return <TwoFactorScreen />
  if (step === 'recovery-code') return <RecoveryCodeScreen />
  return <CredentialsScreen />
}

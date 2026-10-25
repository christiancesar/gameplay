import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'

import { SignInView } from '@/modules/auth/views/sign-in.view'
import { TwoFactorView } from '@/modules/auth/views/two-factor.view'
import { RecoveryCodeView } from '@/modules/auth/views/recovery-code.view'
import { useSignInViewModel } from '@/modules/auth/view-models/use-sign-in.view-model'
import { useTwoFactorViewModel } from '@/modules/auth/view-models/use-two-factor.view-model'
import { useRecoveryCodeViewModel } from '@/modules/auth/view-models/use-recovery-code.view-model'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
] as const

type Step = 'credentials' | 'two-factor' | 'recovery-code'

export function SignInScreen() {
  const search = useSearch({ from: '/_guest/sign-in' })
  const step = ((search as { step?: Step }).step || 'credentials') as Step
  const { signIn, goToSignUp } = useSignInViewModel()
  const { verifyTotp, goBack: goBackTwoFactor, goToRecovery } = useTwoFactorViewModel()
  const { verifyRecovery, goBack: goBackRecovery } = useRecoveryCodeViewModel()
  const { language, setLanguage } = useLanguageViewModel()

  const [formError, setFormError] = useState<string | undefined>()

  const layout = {
    language,
    languageOptions: LANGUAGE_OPTIONS,
    onLanguageChange: (next: string) => setLanguage(next as any),
  }

  if (step === 'two-factor') {
    return (
      <TwoFactorView
        {...layout}
        isSubmitting={false}
        formError={formError as any}
        onSubmit={async (values) => {
          setFormError(undefined)
          const res = await verifyTotp(values.code)
          if (!res.ok && res.formErrorKey) setFormError(res.formErrorKey)
        }}
        onBack={goBackTwoFactor}
        onUseRecoveryCodeClick={goToRecovery}
      />
    )
  }

  if (step === 'recovery-code') {
    return (
      <RecoveryCodeView
        {...layout}
        isSubmitting={false}
        formError={formError as any}
        onSubmit={async (values) => {
          setFormError(undefined)
          const res = await verifyRecovery(values.code)
          if (!res.ok && res.formErrorKey) setFormError(res.formErrorKey)
        }}
        onBack={goBackRecovery}
        onUseAuthenticatorClick={goBackTwoFactor}
      />
    )
  }

  return (
    <SignInView
      {...layout}
      isSubmitting={false}
      formError={formError as any}
      onSubmit={async (values) => {
        setFormError(undefined)
        const res = await signIn(values)
        if (!res.ok && res.formErrorKey) setFormError(res.formErrorKey)
      }}
      onSignUpClick={goToSignUp}
    />
  )
}

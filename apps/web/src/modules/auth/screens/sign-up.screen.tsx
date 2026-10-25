import { useState } from 'react'

import { SignUpView } from '@/modules/auth/views/sign-up.view'
import { useSignUpViewModel } from '@/modules/auth/view-models/use-sign-up.view-model'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
] as const

export function SignUpScreen() {
  const { signUp, goToSignIn } = useSignUpViewModel()
  const { language, setLanguage } = useLanguageViewModel()
  const [formError, setFormError] = useState<string | undefined>()
  const layout = {
    language,
    languageOptions: LANGUAGE_OPTIONS,
    onLanguageChange: (next: string) => setLanguage(next as any),
  }

  return (
    <SignUpView
      {...layout}
      isSubmitting={false}
      formError={formError as any}
      onSubmit={async (values) => {
        setFormError(undefined)
        const res = await signUp(values)
        if (!res.ok && res.formErrorKey) setFormError(res.formErrorKey)
        if (!res.ok && (res as any).serverErrors) {
          const key = Object.values((res as any).serverErrors)[0] as string
          if (key) setFormError(key as any)
        }
      }}
      onSignInClick={goToSignIn}
    />
  )
}

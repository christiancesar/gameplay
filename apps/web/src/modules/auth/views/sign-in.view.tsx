import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'

import { AuthLayoutView, type AuthLayoutViewProps } from './auth-layout.view'
import { SubmitButton } from '@/shared/ui/submit-button'

type SignInStep = 'credentials' | 'twoFactor'

type SignInField = 'identifier' | 'password' | 'twoFactorCode'

type SignInFormError =
  | 'invalidCredentials'
  | 'accountSuspended'
  | 'invalidTwoFactorCode'
  | 'tooManyAttempts'
  | 'unexpected'

type SignInViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  step: SignInStep
  values: Record<SignInField, string>
  useRecoveryCode: boolean
  isSubmitting: boolean
  formError?: SignInFormError
  onChange: (field: SignInField, value: string) => void
  onSubmit: () => void
  onToggleRecoveryCode: () => void
  onBackToCredentials: () => void
  onSignUpClick: () => void
}

function SignInView({
  step,
  values,
  useRecoveryCode,
  isSubmitting,
  formError,
  onChange,
  onSubmit,
  onToggleRecoveryCode,
  onBackToCredentials,
  onSignUpClick,
  ...layout
}: SignInViewProps) {
  const { t } = useTranslation()
  const errorMessage = formError ? t(`auth.errors.${formError}`) : undefined

  return (
    <AuthLayoutView {...layout}>
      <form
        noValidate
        className="bg-card text-card-foreground flex flex-col gap-6 rounded-lg border p-6"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        {step === 'credentials' ? (
          <>
            <h1 className="text-center text-xl font-medium">{t('auth.signIn.title')}</h1>
            <FieldGroup>
              <Field data-invalid={Boolean(formError)}>
                <FieldLabel htmlFor="sign-in-identifier">{t('auth.signIn.identifier')}</FieldLabel>
                <Input
                  id="sign-in-identifier"
                  autoComplete="username"
                  autoFocus
                  value={values.identifier}
                  aria-invalid={Boolean(formError)}
                  onChange={(event) => onChange('identifier', event.target.value)}
                />
              </Field>
              <Field data-invalid={Boolean(formError)}>
                <FieldLabel htmlFor="sign-in-password">{t('auth.signIn.password')}</FieldLabel>
                <Input
                  id="sign-in-password"
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  aria-invalid={Boolean(formError)}
                  onChange={(event) => onChange('password', event.target.value)}
                />
              </Field>
              {errorMessage && <FieldError>{errorMessage}</FieldError>}
            </FieldGroup>
            <SubmitButton isSubmitting={isSubmitting} label={t('auth.signIn.submit')} />
            <p className="text-muted-foreground text-center text-sm">
              {t('auth.signIn.noAccount')}{' '}
              <Button type="button" variant="link" className="h-auto p-0" onClick={onSignUpClick}>
                {t('auth.signIn.signUpLink')}
              </Button>
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-xl font-medium">{t('auth.signIn.twoFactorTitle')}</h1>
              <p className="text-muted-foreground text-sm">
                {useRecoveryCode ? t('auth.signIn.recoveryDescription') : t('auth.signIn.twoFactorDescription')}
              </p>
            </div>
            <FieldGroup>
              {useRecoveryCode ? (
                <Field data-invalid={Boolean(formError)}>
                  <FieldLabel htmlFor="sign-in-recovery-code">{t('auth.signIn.recoveryCode')}</FieldLabel>
                  <Input
                    id="sign-in-recovery-code"
                    autoComplete="off"
                    autoFocus
                    spellCheck={false}
                    className="font-mono"
                    value={values.twoFactorCode}
                    aria-invalid={Boolean(formError)}
                    onChange={(event) => onChange('twoFactorCode', event.target.value)}
                  />
                </Field>
              ) : (
                <Field data-invalid={Boolean(formError)} className="items-center">
                  <FieldLabel htmlFor="sign-in-totp" className="sr-only">
                    {t('auth.signIn.twoFactorCode')}
                  </FieldLabel>
                  <InputOTP
                    id="sign-in-totp"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    containerClassName="justify-center"
                    value={values.twoFactorCode}
                    aria-invalid={Boolean(formError)}
                    onChange={(value) => onChange('twoFactorCode', value)}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, index) => (
                        <InputOTPSlot key={index} index={index} className="size-10 text-base" aria-invalid={Boolean(formError)} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
              )}
              {errorMessage && <FieldError className="text-center">{errorMessage}</FieldError>}
              <FieldDescription className="text-center">
                <Button type="button" variant="link" className="h-auto p-0" onClick={onToggleRecoveryCode}>
                  {useRecoveryCode ? t('auth.signIn.useAuthenticatorCode') : t('auth.signIn.useRecoveryCode')}
                </Button>
              </FieldDescription>
            </FieldGroup>
            <SubmitButton isSubmitting={isSubmitting} label={t('auth.signIn.verify')} />
            <Button type="button" variant="ghost" onClick={onBackToCredentials} disabled={isSubmitting}>
              {t('auth.signIn.back')}
            </Button>
          </>
        )}
      </form>
    </AuthLayoutView>
  )
}

export { SignInView }
export type { SignInField, SignInFormError, SignInStep, SignInViewProps }

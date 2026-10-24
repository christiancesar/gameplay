import { zodResolver } from '@hookform/resolvers/zod'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  signInCredentialsSchema,
  type SignInCredentials,
  type SignInFieldError,
} from '@/modules/auth/model/sign-in.schema'
import {
  recoveryCodeSchema,
  TOTP_LENGTH,
  totpCodeSchema,
  type TwoFactorCodeError,
  type TwoFactorCodeValues,
} from '@/modules/auth/model/two-factor.schema'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'
import { SubmitButton } from '@/shared/ui/submit-button'

import { AuthLayoutView, type AuthLayoutViewProps } from './auth-layout.view'

type SignInStep = 'credentials' | 'twoFactor'

/** Erros que só o servidor conhece. Os de preenchimento vêm do schema. */
type SignInFormError =
  | 'invalidCredentials'
  | 'accountSuspended'
  | 'invalidTwoFactorCode'
  | 'tooManyAttempts'
  | 'unexpected'

type SignInViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  step: SignInStep
  /** Valores iniciais do passo de credenciais (ex.: login lembrado). */
  defaultCredentials?: Partial<SignInCredentials>
  useRecoveryCode: boolean
  isSubmitting: boolean
  formError?: SignInFormError
  /** Chamado só com dados que passaram no schema. */
  onSubmitCredentials: (values: SignInCredentials) => void
  onSubmitTwoFactor: (values: TwoFactorCodeValues) => void
  onToggleRecoveryCode: () => void
  onBackToCredentials: () => void
  onSignUpClick: () => void
}

const formClassName = 'bg-card text-card-foreground flex flex-col gap-6 rounded-lg border p-6'

function SignInView({
  step,
  defaultCredentials,
  useRecoveryCode,
  isSubmitting,
  formError,
  onSubmitCredentials,
  onSubmitTwoFactor,
  onToggleRecoveryCode,
  onBackToCredentials,
  onSignUpClick,
  ...layout
}: SignInViewProps) {
  return (
    <AuthLayoutView {...layout}>
      {step === 'credentials' ? (
        <CredentialsForm
          defaultValues={defaultCredentials}
          isSubmitting={isSubmitting}
          formError={formError}
          onSubmit={onSubmitCredentials}
          onSignUpClick={onSignUpClick}
        />
      ) : (
        // A key recria o form ao trocar entre app autenticador e código de recuperação.
        <TwoFactorForm
          key={useRecoveryCode ? 'recovery' : 'totp'}
          useRecoveryCode={useRecoveryCode}
          isSubmitting={isSubmitting}
          formError={formError}
          onSubmit={onSubmitTwoFactor}
          onToggleRecoveryCode={onToggleRecoveryCode}
          onBack={onBackToCredentials}
        />
      )}
    </AuthLayoutView>
  )
}

type CredentialsFormProps = {
  defaultValues?: Partial<SignInCredentials>
  isSubmitting: boolean
  formError?: SignInFormError
  onSubmit: (values: SignInCredentials) => void
  onSignUpClick: () => void
}

function CredentialsForm({ defaultValues, isSubmitting, formError, onSubmit, onSignUpClick }: CredentialsFormProps) {
  const { t } = useTranslation()
  const form = useForm<SignInCredentials>({
    resolver: zodResolver(signInCredentialsSchema),
    defaultValues: { identifier: '', password: '', ...defaultValues },
  })

  return (
    <form noValidate className={formClassName} onSubmit={form.handleSubmit(onSubmit)}>
      <h1 className="text-center text-xl font-medium">{t('auth.signIn.title')}</h1>
      <FieldGroup>
        <Controller
          name="identifier"
          control={form.control}
          render={({ field, fieldState }) => {
            const invalid = fieldState.invalid || Boolean(formError)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="sign-in-identifier">{t('auth.signIn.identifier')}</FieldLabel>
                <Input {...field} id="sign-in-identifier" autoComplete="username" autoFocus aria-invalid={invalid} />
                {fieldState.error?.message && (
                  <FieldError>{t(`auth.errors.${fieldState.error.message as SignInFieldError}`)}</FieldError>
                )}
              </Field>
            )
          }}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => {
            const invalid = fieldState.invalid || Boolean(formError)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="sign-in-password">{t('auth.signIn.password')}</FieldLabel>
                <Input
                  {...field}
                  id="sign-in-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={invalid}
                />
                {fieldState.error?.message && (
                  <FieldError>{t(`auth.errors.${fieldState.error.message as SignInFieldError}`)}</FieldError>
                )}
              </Field>
            )
          }}
        />
        {formError && <FieldError>{t(`auth.errors.${formError}`)}</FieldError>}
      </FieldGroup>
      <SubmitButton isSubmitting={isSubmitting} label={t('auth.signIn.submit')} />
      <p className="text-muted-foreground text-center text-sm">
        {t('auth.signIn.noAccount')}{' '}
        <Button type="button" variant="link" className="h-auto p-0" onClick={onSignUpClick}>
          {t('auth.signIn.signUpLink')}
        </Button>
      </p>
    </form>
  )
}

type TwoFactorFormProps = {
  useRecoveryCode: boolean
  isSubmitting: boolean
  formError?: SignInFormError
  onSubmit: (values: TwoFactorCodeValues) => void
  onToggleRecoveryCode: () => void
  onBack: () => void
}

function TwoFactorForm({
  useRecoveryCode,
  isSubmitting,
  formError,
  onSubmit,
  onToggleRecoveryCode,
  onBack,
}: TwoFactorFormProps) {
  const { t } = useTranslation()
  const form = useForm<TwoFactorCodeValues>({
    resolver: zodResolver(useRecoveryCode ? recoveryCodeSchema : totpCodeSchema),
    defaultValues: { code: '' },
  })

  return (
    <form noValidate className={formClassName} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-medium">{t('auth.signIn.twoFactorTitle')}</h1>
        <p className="text-muted-foreground text-sm">
          {useRecoveryCode ? t('auth.signIn.recoveryDescription') : t('auth.signIn.twoFactorDescription')}
        </p>
      </div>
      <FieldGroup>
        <Controller
          name="code"
          control={form.control}
          render={({ field, fieldState }) => {
            const invalid = fieldState.invalid || Boolean(formError)
            const message = (fieldState.error?.message as TwoFactorCodeError | undefined) ?? formError
            return (
              <>
                {useRecoveryCode ? (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor="sign-in-recovery-code">{t('auth.signIn.recoveryCode')}</FieldLabel>
                    <Input
                      {...field}
                      id="sign-in-recovery-code"
                      autoComplete="off"
                      autoFocus
                      spellCheck={false}
                      className="font-mono"
                      aria-invalid={invalid}
                    />
                  </Field>
                ) : (
                  <Field data-invalid={invalid} className="items-center">
                    <FieldLabel htmlFor="sign-in-totp" className="sr-only">
                      {t('auth.signIn.twoFactorCode')}
                    </FieldLabel>
                    <InputOTP
                      id="sign-in-totp"
                      ref={field.ref}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      maxLength={TOTP_LENGTH}
                      pattern={REGEXP_ONLY_DIGITS}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      containerClassName="justify-center"
                      aria-invalid={invalid}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: TOTP_LENGTH }, (_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="size-10 text-base"
                            aria-invalid={invalid}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </Field>
                )}
                {message && (
                  <FieldError className={useRecoveryCode ? undefined : 'text-center'}>
                    {t(`auth.errors.${message}`)}
                  </FieldError>
                )}
              </>
            )
          }}
        />
        <FieldDescription className="text-center">
          <Button type="button" variant="link" className="h-auto p-0" onClick={onToggleRecoveryCode}>
            {useRecoveryCode ? t('auth.signIn.useAuthenticatorCode') : t('auth.signIn.useRecoveryCode')}
          </Button>
        </FieldDescription>
      </FieldGroup>
      <SubmitButton isSubmitting={isSubmitting} label={t('auth.signIn.verify')} />
      <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
        {t('auth.signIn.back')}
      </Button>
    </form>
  )
}

export { SignInView }
export type { SignInFormError, SignInStep, SignInViewProps }

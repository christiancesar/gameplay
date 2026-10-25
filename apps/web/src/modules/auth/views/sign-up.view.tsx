import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'

import {
  INVITE_KEY_LENGTH,
  INVITE_KEY_PATTERN,
  signUpSchema,
  type SignUpField,
  type SignUpFieldError,
  type SignUpInput,
  type SignUpServerError,
  type SignUpValues,
} from '@/modules/auth/model/sign-up.schema'
import { useServerErrors } from '@/shared/lib/form'

import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'

import { SubmitButton } from '@/shared/ui/submit-button'

import { AuthLayoutView, type AuthLayoutViewProps } from './auth-layout.view'

type SignUpFormError = 'unexpected'

type SignUpViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  defaultValues?: Partial<SignUpInput>
  /** Erros por campo vindos do servidor; somem quando o usuário corrige o campo. */
  fieldErrors?: Partial<Record<SignUpField, SignUpServerError>>
  formError?: SignUpFormError
  isSubmitting: boolean
  /** Nome do servidor quando o cadastro veio de um link de convite (F3). */
  invitedServerName?: string
  /** Chamado só com dados que passaram no schema. */
  onSubmit: (values: SignUpValues) => void
  onSignInClick: () => void
}

function SignUpView({
  defaultValues,
  fieldErrors,
  formError,
  isSubmitting,
  invitedServerName,
  onSubmit,
  onSignInClick,
  ...layout
}: SignUpViewProps) {
  const { t } = useTranslation()
  const form = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '', inviteKey: '', ...defaultValues },
    errors: useServerErrors<SignUpInput>(fieldErrors),
  })

  const textField = (
    name: Exclude<SignUpField, 'inviteKey'>,
    props: { type?: string; autoComplete: string; autoFocus?: boolean },
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => {
        const id = `sign-up-${name}`
        const error = fieldState.error?.message as SignUpFieldError | undefined
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{t(`auth.signUp.${name}`)}</FieldLabel>
            <Input
              {...field}
              id={id}
              {...props}
              aria-invalid={fieldState.invalid}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && <FieldError id={`${id}-error`}>{t(`auth.errors.${error}`)}</FieldError>}
          </Field>
        )
      }}
    />
  )

  return (
    <AuthLayoutView {...layout}>
      <form
        noValidate
        className="bg-card text-card-foreground flex flex-col gap-6 rounded-lg border p-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-medium">{t('auth.signUp.title')}</h1>
          {invitedServerName && (
            <p className="text-muted-foreground text-sm">
              <Trans
                i18nKey="auth.signUp.invitedTo"
                values={{ serverName: invitedServerName }}
                components={{ strong: <strong className="text-card-foreground font-medium" /> }}
              />
            </p>
          )}
        </div>
        <FieldGroup>
          {textField('username', { autoComplete: 'username', autoFocus: true })}
          {textField('email', { type: 'email', autoComplete: 'email' })}
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            {textField('password', { type: 'password', autoComplete: 'new-password' })}
            {textField('confirmPassword', { type: 'password', autoComplete: 'new-password' })}
          </div>
          <Controller
            name="inviteKey"
            control={form.control}
            render={({ field, fieldState }) => {
              const error = fieldState.error?.message as SignUpFieldError | undefined
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-invite-key">{t('auth.signUp.inviteKey')}</FieldLabel>
                  <InputOTP
                    id="sign-up-invite-key"
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    maxLength={INVITE_KEY_LENGTH}
                    pattern={INVITE_KEY_PATTERN}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={error ? 'sign-up-invite-key-error' : 'sign-up-invite-key-description'}
                  >
                    <InputOTPGroup className="w-full">
                      {Array.from({ length: INVITE_KEY_LENGTH }, (_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="h-10 flex-1 font-mono text-base uppercase"
                          aria-invalid={fieldState.invalid}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {error ? (
                    <FieldError id="sign-up-invite-key-error">{t(`auth.errors.${error}`)}</FieldError>
                  ) : (
                    <FieldDescription id="sign-up-invite-key-description">
                      {t('auth.signUp.inviteKeyDescription')}
                    </FieldDescription>
                  )}
                </Field>
              )
            }}
          />
          {formError && <FieldError>{t(`auth.errors.${formError}`)}</FieldError>}
        </FieldGroup>
        <SubmitButton isSubmitting={isSubmitting} label={t('auth.signUp.submit')} />
        <p className="text-muted-foreground text-center text-sm">
          {t('auth.signUp.hasAccount')}{' '}
          <Button type="button" variant="link" className="h-auto p-0" onClick={onSignInClick}>
            {t('auth.signUp.signInLink')}
          </Button>
        </p>
      </form>
    </AuthLayoutView>
  )
}

export { SignUpView }
export type { SignUpFormError, SignUpViewProps }

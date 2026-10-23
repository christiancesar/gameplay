import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'

import { AuthLayoutView, type AuthLayoutViewProps } from './auth-layout.view'
import { SubmitButton } from './submit-button.view'

type SignUpField = 'username' | 'email' | 'password' | 'confirmPassword' | 'inviteKey'

type SignUpFieldError =
  | 'required'
  | 'usernameInvalid'
  | 'usernameTaken'
  | 'emailInvalid'
  | 'emailTaken'
  | 'passwordTooShort'
  | 'passwordMismatch'
  | 'inviteKeyIncomplete'
  | 'inviteKeyInvalid'
  | 'inviteKeyExpired'
  | 'inviteKeyRevoked'
  | 'inviteKeyUsed'
  | 'tooManyAttempts'

type SignUpFormError = 'unexpected'

type SignUpViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  values: Record<SignUpField, string>
  fieldErrors: Partial<Record<SignUpField, SignUpFieldError>>
  formError?: SignUpFormError
  isSubmitting: boolean
  /** Nome do servidor quando o cadastro veio de um link de convite (F3). */
  invitedServerName?: string
  onChange: (field: SignUpField, value: string) => void
  onSubmit: () => void
  onSignInClick: () => void
}

const INVITE_KEY_LENGTH = 6

function SignUpView({
  values,
  fieldErrors,
  formError,
  isSubmitting,
  invitedServerName,
  onChange,
  onSubmit,
  onSignInClick,
  ...layout
}: SignUpViewProps) {
  const { t } = useTranslation()

  const textField = (
    field: Exclude<SignUpField, 'inviteKey'>,
    props: { type?: string; autoComplete: string; autoFocus?: boolean },
  ) => {
    const error = fieldErrors[field]
    const id = `sign-up-${field}`
    return (
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor={id}>{t(`auth.signUp.${field}`)}</FieldLabel>
        <Input
          id={id}
          {...props}
          value={values[field]}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(field, event.target.value)}
        />
        {error && <FieldError id={`${id}-error`}>{t(`auth.errors.${error}`)}</FieldError>}
      </Field>
    )
  }

  const inviteKeyError = fieldErrors.inviteKey

  return (
    <AuthLayoutView {...layout}>
      <form
        noValidate
        className="bg-card text-card-foreground flex flex-col gap-6 rounded-lg p-6"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
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
          <Field data-invalid={Boolean(inviteKeyError)}>
            <FieldLabel htmlFor="sign-up-invite-key">{t('auth.signUp.inviteKey')}</FieldLabel>
            <InputOTP
              id="sign-up-invite-key"
              maxLength={INVITE_KEY_LENGTH}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              autoComplete="off"
              spellCheck={false}
              value={values.inviteKey}
              aria-invalid={Boolean(inviteKeyError)}
              aria-describedby={inviteKeyError ? 'sign-up-invite-key-error' : 'sign-up-invite-key-description'}
              onChange={(value) => onChange('inviteKey', value)}
            >
              <InputOTPGroup className="w-full">
                {Array.from({ length: INVITE_KEY_LENGTH }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-10 flex-1 font-mono text-base uppercase"
                    aria-invalid={Boolean(inviteKeyError)}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {inviteKeyError ? (
              <FieldError id="sign-up-invite-key-error">{t(`auth.errors.${inviteKeyError}`)}</FieldError>
            ) : (
              <FieldDescription id="sign-up-invite-key-description">
                {t('auth.signUp.inviteKeyDescription')}
              </FieldDescription>
            )}
          </Field>
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
export type { SignUpField, SignUpFieldError, SignUpFormError, SignUpViewProps }

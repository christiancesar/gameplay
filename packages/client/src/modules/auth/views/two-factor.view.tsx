import type { TwoFactorFormError } from '@/modules/auth/model/entities/two-factor-form-error'
import { zodResolver } from '@hookform/resolvers/zod'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  TOTP_LENGTH,
  totpCodeSchema,
  type TwoFactorCodeError,
  type TwoFactorCodeValues,
} from '@/modules/auth/model/two-factor.schema'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'
import { SubmitButton } from '@/shared/ui/submit-button'

import { AuthLayoutView, type AuthLayoutViewProps } from './auth-layout.view'

/** Erros que só o servidor conhece, compartilhados com o código de recuperação. */
type TwoFactorViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  isSubmitting: boolean
  formError?: TwoFactorFormError
  /** Chamado só com dados que passaram no schema. */
  onSubmit: (values: TwoFactorCodeValues) => void
  onUseRecoveryCodeClick: () => void
  onBack: () => void
}

/** Segunda etapa do login de admin (`/sign-in?step=two-factor`): código do app autenticador. */
function TwoFactorView({
  isSubmitting,
  formError,
  onSubmit,
  onUseRecoveryCodeClick,
  onBack,
  ...layout
}: TwoFactorViewProps) {
  const { t } = useTranslation()
  const form = useForm<TwoFactorCodeValues>({
    resolver: zodResolver(totpCodeSchema),
    defaultValues: { code: '' },
  })

  return (
    <AuthLayoutView {...layout}>
      <form
        noValidate
        className="bg-card text-card-foreground flex flex-col gap-6 rounded-lg border p-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-medium">{t('auth.signIn.twoFactorTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('auth.signIn.twoFactorDescription')}</p>
        </div>
        <FieldGroup>
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => {
              const invalid = fieldState.invalid || Boolean(formError)
              const message = (fieldState.error?.message as TwoFactorCodeError | undefined) ?? formError
              return (
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
                        <InputOTPSlot key={index} index={index} className="size-10 text-base" aria-invalid={invalid} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {message && <FieldError className="text-center">{t(`auth.errors.${message}`)}</FieldError>}
                </Field>
              )
            }}
          />
          <FieldDescription className="text-center">
            <Button type="button" variant="link" className="h-auto p-0" onClick={onUseRecoveryCodeClick}>
              {t('auth.signIn.useRecoveryCode')}
            </Button>
          </FieldDescription>
        </FieldGroup>
        <SubmitButton isSubmitting={isSubmitting} label={t('auth.signIn.verify')} />
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
          {t('auth.signIn.back')}
        </Button>
      </form>
    </AuthLayoutView>
  )
}

export { TwoFactorView }
export type { TwoFactorViewProps }

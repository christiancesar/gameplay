import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  recoveryCodeSchema,
  type TwoFactorCodeError,
  type TwoFactorCodeValues,
} from '@/modules/auth/model/two-factor.schema'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

import { AuthLayoutView, type AuthLayoutViewProps } from './auth-layout.view'
import type { TwoFactorFormError } from './two-factor.view'

type RecoveryCodeViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  isSubmitting: boolean
  formError?: TwoFactorFormError
  /** Chamado só com dados que passaram no schema. */
  onSubmit: (values: TwoFactorCodeValues) => void
  onUseAuthenticatorClick: () => void
  onBack: () => void
}

/** Alternativa ao app autenticador (`/sign-in?step=recovery-code`): um dos códigos de recuperação do admin. */
function RecoveryCodeView({
  isSubmitting,
  formError,
  onSubmit,
  onUseAuthenticatorClick,
  onBack,
  ...layout
}: RecoveryCodeViewProps) {
  const { t } = useTranslation()
  const form = useForm<TwoFactorCodeValues>({
    resolver: zodResolver(recoveryCodeSchema),
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
          <p className="text-muted-foreground text-sm">{t('auth.signIn.recoveryDescription')}</p>
        </div>
        <FieldGroup>
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => {
              const invalid = fieldState.invalid || Boolean(formError)
              const message = (fieldState.error?.message as TwoFactorCodeError | undefined) ?? formError
              return (
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
                  {message && <FieldError>{t(`auth.errors.${message}`)}</FieldError>}
                </Field>
              )
            }}
          />
          <FieldDescription className="text-center">
            <Button type="button" variant="link" className="h-auto p-0" onClick={onUseAuthenticatorClick}>
              {t('auth.signIn.useAuthenticatorCode')}
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

export { RecoveryCodeView }
export type { RecoveryCodeViewProps }

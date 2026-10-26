import type { SignInFormError } from '@/modules/auth/model/entities/sign-in-form-error'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  signInCredentialsSchema,
  type SignInCredentials,
  type SignInFieldError,
} from '@/modules/auth/model/sign-in.schema'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

import { AuthLayoutView, type AuthLayoutViewProps } from './auth-layout.view'

/** Erros que só o servidor conhece. Os de preenchimento vêm do schema. */
type SignInViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  /** Valores iniciais (ex.: login lembrado). */
  defaultValues?: Partial<SignInCredentials>
  isSubmitting: boolean
  formError?: SignInFormError
  /** Chamado só com dados que passaram no schema. */
  onSubmit: (values: SignInCredentials) => void
  onSignUpClick: () => void
}

/** Primeira etapa do login (`/sign-in`): email ou username e senha. */
function SignInView({ defaultValues, isSubmitting, formError, onSubmit, onSignUpClick, ...layout }: SignInViewProps) {
  const { t } = useTranslation()
  const form = useForm<SignInCredentials>({
    resolver: zodResolver(signInCredentialsSchema),
    defaultValues: { identifier: '', password: '', ...defaultValues },
  })

  return (
    <AuthLayoutView {...layout}>
      <form
        noValidate
        className="bg-card text-card-foreground flex flex-col gap-6 rounded-lg border p-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
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
    </AuthLayoutView>
  )
}

export { SignInView }
export type { SignInViewProps }

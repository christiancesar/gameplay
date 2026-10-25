import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { confirmPasswordSchema, type ConfirmPasswordValues } from '@/modules/admin/model/two-factor-setup.schema'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

type ConfirmPasswordFormProps = {
  isSubmitting: boolean
  /** Servidor recusou a senha. */
  invalidPassword: boolean
  onSubmit: (values: ConfirmPasswordValues) => void
}

function ConfirmPasswordForm({ isSubmitting, invalidPassword, onSubmit }: ConfirmPasswordFormProps) {
  const { t } = useTranslation()
  const form = useForm<ConfirmPasswordValues>({
    resolver: zodResolver(confirmPasswordSchema),
    defaultValues: { password: '' },
  })
  const error =
    (form.formState.errors.password?.message as 'required' | undefined) ??
    (invalidPassword ? 'invalidPassword' : undefined)

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="admin-setup-password">{t('admin.setup.password')}</FieldLabel>
        <Input
          {...form.register('password')}
          id="admin-setup-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
        />
        {error && <FieldError>{t(`auth.errors.${error}`)}</FieldError>}
      </Field>
      <SubmitButton isSubmitting={isSubmitting} label={t('admin.setup.continue')} />
    </form>
  )
}

export { ConfirmPasswordForm }
export type { ConfirmPasswordFormProps }

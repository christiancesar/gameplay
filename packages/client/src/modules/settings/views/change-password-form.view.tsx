import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  changePasswordSchema,
  type ChangePasswordValues,
  type ProfileServerError,
  type ProfileValidationError,
} from '@/modules/settings/model/profile.schema'
import { useServerErrors } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

type ChangePasswordFormProps = {
  isSaving: boolean
  error?: Extract<ProfileServerError, 'invalidPassword'>
  /** Mostra a confirmação depois de trocar; o ViewModel remonta o form (key) para limpar os campos. */
  changed: boolean
  onSubmit: (values: Pick<ChangePasswordValues, 'currentPassword' | 'newPassword'>) => void
}

const FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

function ChangePasswordForm({ isSaving, error, changed, onSubmit }: ChangePasswordFormProps) {
  const { t } = useTranslation()
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    errors: useServerErrors<ChangePasswordValues>(error ? { currentPassword: error } : undefined),
  })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(({ currentPassword, newPassword }) => onSubmit({ currentPassword, newPassword }))}
    >
      <FieldGroup>
        {FIELDS.map((name) => {
          const fieldError = form.formState.errors[name]?.message as
            | ProfileValidationError
            | ProfileServerError
            | undefined
          return (
            <Field key={name} data-invalid={Boolean(fieldError)}>
              <FieldLabel htmlFor={`profile-${name}`}>{t(`settings.profile.${name}`)}</FieldLabel>
              <Input
                {...form.register(name)}
                id={`profile-${name}`}
                type="password"
                autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                aria-invalid={Boolean(fieldError)}
              />
              {fieldError && <FieldError>{t(`auth.errors.${fieldError}`)}</FieldError>}
            </Field>
          )
        })}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="secondary" disabled={isSaving}>
            {t('settings.profile.changePassword')}
          </Button>
          {changed && <FieldDescription>{t('settings.profile.passwordChanged')}</FieldDescription>}
        </div>
      </FieldGroup>
    </form>
  )
}

export { ChangePasswordForm }
export type { ChangePasswordFormProps }

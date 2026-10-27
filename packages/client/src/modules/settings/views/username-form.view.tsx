import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  usernameFormSchema,
  type ProfileServerError,
  type ProfileValidationError,
  type UsernameFormValues,
} from '@/modules/settings/model/profile.schema'
import { useServerErrors } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

type UsernameFormProps = {
  /** Como o usuário escreveu (displayUsername); o login aceita qualquer caixa. */
  username: string
  isSaving: boolean
  error?: Extract<ProfileServerError, 'usernameTaken'>
  onSave: (username: string) => void
}

function UsernameForm({ username, isSaving, error, onSave }: UsernameFormProps) {
  const { t } = useTranslation()
  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: { username },
    errors: useServerErrors<UsernameFormValues>(error ? { username: error } : undefined),
  })
  const fieldError = form.formState.errors.username?.message as ProfileValidationError | ProfileServerError | undefined

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => onSave(values.username))}>
      <Field data-invalid={Boolean(fieldError)}>
        <FieldLabel htmlFor="profile-username">{t('settings.profile.username')}</FieldLabel>
        <div className="flex gap-2">
          <Input
            {...form.register('username')}
            id="profile-username"
            autoComplete="username"
            spellCheck={false}
            aria-invalid={Boolean(fieldError)}
          />
          <Button type="submit" variant="secondary" disabled={isSaving || !form.formState.isDirty}>
            {t('common.save')}
          </Button>
        </div>
        {fieldError ? (
          <FieldError>{t(`auth.errors.${fieldError}`)}</FieldError>
        ) : (
          <FieldDescription>{t('auth.errors.usernameInvalid')}</FieldDescription>
        )}
      </Field>
    </form>
  )
}

export { UsernameForm }
export type { UsernameFormProps }

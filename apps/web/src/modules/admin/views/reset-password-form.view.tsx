import { zodResolver } from '@hookform/resolvers/zod'
import { CopyIcon, RefreshCwIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { resetPasswordSchema, type ResetPasswordValues } from '@/modules/admin/model/reset-password.schema'
import { Button } from '@/shared/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { IconButton } from '@/shared/ui/icon-button'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

import type { ResetPasswordDialogViewProps } from './reset-password-dialog.view'

type ResetPasswordFormProps = Omit<ResetPasswordDialogViewProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

function ResetPasswordForm({
  userName,
  initialPassword,
  isSubmitting,
  onGenerate,
  onCopy,
  onSubmit,
  onCancel,
}: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: initialPassword },
  })
  const password = useWatch({ control: form.control, name: 'password' })
  const error = form.formState.errors.password?.message as 'required' | 'passwordTooShort' | undefined

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>{t('admin.resetPassword.title', { name: userName })}</DialogTitle>
        <DialogDescription>{t('admin.resetPassword.description')}</DialogDescription>
      </DialogHeader>
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="reset-password">{t('admin.resetPassword.newPassword')}</FieldLabel>
        <div className="flex gap-1">
          <Input
            {...form.register('password')}
            id="reset-password"
            className="font-mono"
            autoComplete="off"
            aria-invalid={Boolean(error)}
          />
          <IconButton
            label={t('admin.resetPassword.generate')}
            icon={<RefreshCwIcon />}
            onClick={() =>
              form.setValue('password', onGenerate(), { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
            }
          />
          <IconButton
            label={t('common.copy')}
            icon={<CopyIcon />}
            onClick={() => onCopy(password)}
            disabled={!password}
          />
        </div>
        {error && <FieldError>{t(`auth.errors.${error}`)}</FieldError>}
      </Field>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <SubmitButton isSubmitting={isSubmitting} label={t('admin.resetPassword.submit')} />
      </DialogFooter>
    </form>
  )
}

export { ResetPasswordForm }
export type { ResetPasswordFormProps }

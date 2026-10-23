import { zodResolver } from '@hookform/resolvers/zod'
import { CopyIcon, RefreshCwIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { resetPasswordSchema, type ResetPasswordValues } from '@/modules/admin/model/reset-password.schema'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { IconButton } from '@/shared/ui/icon-button'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

type ResetPasswordDialogViewProps = {
  open: boolean
  userName: string
  /** Senha sugerida ao abrir. */
  initialPassword: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  /** Gera uma senha aleatória nova; a View coloca no campo. */
  onGenerate: () => string
  onCopy: (password: string) => void
  /** Chamado só com dados que passaram no schema. */
  onSubmit: (values: ResetPasswordValues) => void
}

function ResetPasswordDialogView({ open, onOpenChange, ...props }: ResetPasswordDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ResetPasswordForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type ResetPasswordFormProps = Omit<ResetPasswordDialogViewProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

function ResetPasswordForm({ userName, initialPassword, isSubmitting, onGenerate, onCopy, onSubmit, onCancel }: ResetPasswordFormProps) {
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
          <Input {...form.register('password')} id="reset-password" className="font-mono" autoComplete="off" aria-invalid={Boolean(error)} />
          <IconButton
            label={t('admin.resetPassword.generate')}
            icon={<RefreshCwIcon />}
            onClick={() => form.setValue('password', onGenerate(), { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
          />
          <IconButton label={t('common.copy')} icon={<CopyIcon />} onClick={() => onCopy(password)} disabled={!password} />
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

export { ResetPasswordDialogView }
export type { ResetPasswordDialogViewProps }

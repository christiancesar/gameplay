import { CopyIcon, RefreshCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { IconButton } from '@/shared/ui/icon-button'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

type ResetPasswordDialogViewProps = {
  open: boolean
  userName: string
  password: string
  error?: 'passwordTooShort'
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onPasswordChange: (value: string) => void
  onGenerate: () => void
  onCopy: () => void
  onSubmit: () => void
}

function ResetPasswordDialogView({
  open,
  userName,
  password,
  error,
  isSubmitting,
  onOpenChange,
  onPasswordChange,
  onGenerate,
  onCopy,
  onSubmit,
}: ResetPasswordDialogViewProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('admin.resetPassword.title', { name: userName })}</DialogTitle>
            <DialogDescription>{t('admin.resetPassword.description')}</DialogDescription>
          </DialogHeader>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="reset-password">{t('admin.resetPassword.newPassword')}</FieldLabel>
            <div className="flex gap-1">
              <Input
                id="reset-password"
                className="font-mono"
                autoComplete="off"
                value={password}
                aria-invalid={Boolean(error)}
                onChange={(event) => onPasswordChange(event.target.value)}
              />
              <IconButton label={t('admin.resetPassword.generate')} icon={<RefreshCwIcon />} onClick={onGenerate} />
              <IconButton label={t('common.copy')} icon={<CopyIcon />} onClick={onCopy} disabled={!password} />
            </div>
            {error && <FieldError>{t(`auth.errors.${error}`)}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <SubmitButton isSubmitting={isSubmitting} label={t('admin.resetPassword.submit')} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { ResetPasswordDialogView }
export type { ResetPasswordDialogViewProps }

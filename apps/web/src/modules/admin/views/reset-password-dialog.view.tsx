import { type ResetPasswordValues } from '@/modules/admin/model/reset-password.schema'
import { Dialog, DialogContent } from '@/shared/ui/dialog'

import { ResetPasswordForm } from './reset-password-form.view'

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

export { ResetPasswordDialogView }
export type { ResetPasswordDialogViewProps }

import { type CreateServerValues } from '@/modules/servers/model/server.schema'
import { Dialog, DialogContent } from '@/shared/ui/dialog'
import { type ImageError } from '@/shared/ui/image-picker'

import { CreateServerForm } from './create-server-form.view'

/** Erros que só o servidor conhece. Os do nome vêm do schema. */
type CreateServerError = 'limitReached' | 'unexpected'

type CreateServerDialogViewProps = {
  open: boolean
  iconPreviewUrl?: string
  iconError?: ImageError
  formError?: CreateServerError
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSelectIcon: (file: File) => void
  onRemoveIcon: () => void
  /** Chamado só com dados que passaram no schema. */
  onSubmit: (values: CreateServerValues) => void
}

function CreateServerDialogView({ open, onOpenChange, ...props }: CreateServerDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* O form vive dentro do conteúdo do Dialog: fechar desmonta e limpa os campos. */}
        <CreateServerForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export { CreateServerDialogView }
export type { CreateServerDialogViewProps, CreateServerError }

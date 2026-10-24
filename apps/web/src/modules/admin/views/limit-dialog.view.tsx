import { type LimitOverrides } from '@/modules/admin/model/limits.schema'
import { Dialog, DialogContent } from '@/shared/ui/dialog'

import { LimitForm } from './limit-form.view'

type LimitField = {
  id: string
  label: string
  defaultValue: number
  /** undefined = usa o padrão global. */
  override?: number
}

type LimitDialogViewProps = {
  open: boolean
  title: string
  fields: readonly LimitField[]
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  /** Por id do limite: número escolhido, ou undefined para voltar ao padrão global. */
  onSave: (overrides: LimitOverrides) => void
}

/** Override de limites por usuário ou por servidor (2.2). */
function LimitDialogView({ open, onOpenChange, ...props }: LimitDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* O form vive dentro do conteúdo do Dialog: reabrir começa dos valores salvos. */}
        <LimitForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export { LimitDialogView }
export type { LimitDialogViewProps, LimitField }

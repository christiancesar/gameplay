import type { MediaResource } from '@gameplay/contracts'

import type { MediaNoticeValues } from '@/modules/admin/model/media-notice.schema'
import { Dialog, DialogContent } from '@/shared/ui/dialog'

import { MediaOffConfirmForm } from './media-off-confirm-form.view'

type MediaOffConfirmDialogViewProps = {
  open: boolean
  /** O que vai desligar com esta mudança. */
  resources: readonly MediaResource[]
  /** Global ou de um servidor: só no servidor dá para avisar os membros. */
  scope: 'global' | 'server'
  /** Pessoas em salas de voz que perdem o recurso na hora; undefined enquanto carrega. */
  impact?: number
  isSaving: boolean
  onConfirm: (notice?: MediaNoticeValues) => void
  onCancel: () => void
}

/** Confirmação ao desligar recursos de mídia, com o aviso opcional para quem foi afetado. */
function MediaOffConfirmDialogView({ open, onCancel, ...props }: MediaOffConfirmDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        {/* Montado a cada abertura: o aviso começa do texto sugerido. */}
        {open && <MediaOffConfirmForm {...props} onCancel={onCancel} />}
      </DialogContent>
    </Dialog>
  )
}

export { MediaOffConfirmDialogView }
export type { MediaOffConfirmDialogViewProps }

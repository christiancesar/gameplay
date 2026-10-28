import type { MediaResource, MediaSettings } from '@gameplay/contracts'

import type { MediaChoice } from '@/modules/admin/model/media-choice.schema'

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

/** Recursos de mídia de um servidor: o global de cada um e o que o servidor escolheu. */
type LimitDialogMedia = { globals: MediaSettings; choices: Record<MediaResource, MediaChoice> }

type LimitDialogViewProps = {
  open: boolean
  title: string
  fields: readonly LimitField[]
  /** Só no diálogo do servidor. */
  media?: LimitDialogMedia
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  /** Por id do limite: número escolhido, ou undefined para voltar ao padrão global. Com `media`, as escolhas de mídia. */
  onSave: (overrides: LimitOverrides, media?: Record<MediaResource, MediaChoice>) => void
}

/** Override de limites por usuário, ou "Ajustar servidor" (limites e recursos de mídia) (2.2). */
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
export type { LimitDialogMedia, LimitDialogViewProps, LimitField }

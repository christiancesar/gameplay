import { useTranslation } from 'react-i18next'

import type { DownloadFormat } from '../../model/entities/download-option'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

type InstallInstructionsViewProps = {
  format: DownloadFormat | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const instructionSteps = ['download', 'install', 'open'] as const

function InstallInstructionsView({ format, open, onOpenChange }: InstallInstructionsViewProps) {
  const { t } = useTranslation()
  if (!format) return null

  const formatLabel = t(`public.download.formatLabels.${format}`)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('public.download.instructions.title', { format: formatLabel })}</DialogTitle>
          <DialogDescription>{t(`public.download.instructions.description.${format}`)}</DialogDescription>
        </DialogHeader>
        <ol className="text-muted-foreground list-decimal space-y-3 pl-5 leading-relaxed">
          {instructionSteps.map((step) => (
            <li key={step}>{t(`public.download.instructions.steps.${format}.${step}`)}</li>
          ))}
        </ol>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

export { InstallInstructionsView }
export type { InstallInstructionsViewProps }

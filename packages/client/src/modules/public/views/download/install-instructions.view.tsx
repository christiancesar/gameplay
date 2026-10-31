import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { DownloadFormat } from '../../model/entities/download-option'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

type InstallInstructionsViewProps = {
  format: DownloadFormat | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const APPIMAGE_LAUNCHER_RELEASES_URL = 'https://github.com/TheAssassin/AppImageLauncher/releases'

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
        {format === 'appimage' && (
          <div className="bg-muted/50 rounded-lg border p-3 text-sm">
            <p className="font-medium">{t('public.download.instructions.appImageLauncher.title')}</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              {t('public.download.instructions.appImageLauncher.description')}
            </p>
            <a
              className="text-primary mt-2 inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
              href={APPIMAGE_LAUNCHER_RELEASES_URL}
              target="_blank"
              rel="noreferrer"
            >
              {t('public.download.instructions.appImageLauncher.link')}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

export { InstallInstructionsView }
export type { InstallInstructionsViewProps }

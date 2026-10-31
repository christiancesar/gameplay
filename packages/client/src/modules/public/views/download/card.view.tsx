import { BookOpen, Check, Download, Monitor } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { DownloadArtifact, DownloadOption, DownloadPlatform } from '../../model/entities/download-option'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'

import { InstallInstructionsView } from './install-instructions.view'

type DownloadCardProps = {
  option: DownloadOption
  recommended: boolean
  onDownload: (platform: DownloadPlatform, format: DownloadArtifact['format'], url?: string) => void
}

function DownloadCard({ option, recommended, onDownload }: DownloadCardProps) {
  const { t } = useTranslation()
  const [instructionsFormat, setInstructionsFormat] = useState<DownloadArtifact['format'] | null>(null)
  const platform = t(`public.download.platforms.${option.platform}`)

  return (
    <Card className={recommended ? 'h-full border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'h-full'}>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex size-10 items-center justify-center rounded-xl">
            <Monitor className="text-foreground size-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">{platform}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">{option.architecture}</p>
          </div>
        </div>
        {recommended && <Badge variant="secondary">{t('public.download.recommendedBadge')}</Badge>}
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {t(`public.download.platformHints.${option.platform}`)}
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border">
          <div className="bg-muted/40 flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium">
            <span>{t('public.download.latestRelease')}</span>
            <span className="text-muted-foreground">{t('public.download.version', { version: option.version })}</span>
          </div>
          <div className="divide-y">
            {option.artifacts.map((artifact) => {
              const formatLabel = t(`public.download.formatLabels.${artifact.format}`)
              return (
                <div key={artifact.format} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Check className="text-emerald-600 dark:text-emerald-400 size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate text-sm font-medium">{formatLabel}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      disabled={!option.available}
                      aria-label={t(`public.download.formats.${artifact.format}`)}
                      onClick={() => onDownload(option.platform, artifact.format, artifact.url)}
                    >
                      <Download data-icon="inline-start" aria-hidden="true" />
                      {t('public.download.downloadButton')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('public.download.instructions.open', { format: formatLabel })}
                      title={t('public.download.instructions.open', { format: formatLabel })}
                      onClick={() => setInstructionsFormat(artifact.format)}
                    >
                      <BookOpen aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground justify-start text-xs">
        {t('public.download.instructions.hint')}
      </CardFooter>
      <InstallInstructionsView
        format={instructionsFormat}
        open={instructionsFormat !== null}
        onOpenChange={(open) => {
          if (!open) setInstructionsFormat(null)
        }}
      />
    </Card>
  )
}

export { DownloadCard }
export type { DownloadCardProps }

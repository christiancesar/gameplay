import { Check, Download, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { DownloadOption, DownloadPlatform } from '../../model/entities/download-option'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'

type DownloadCardProps = {
  option: DownloadOption
  recommended: boolean
  onDownload: (platform: DownloadPlatform) => void
}

function DownloadCard({ option, recommended, onDownload }: DownloadCardProps) {
  const { t } = useTranslation()
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
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Check className="text-emerald-600 dark:text-emerald-400 size-4" aria-hidden="true" />
          {t('public.download.version', { version: option.version })}
        </div>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {t(`public.download.platformHints.${option.platform}`)}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={!option.available} onClick={() => onDownload(option.platform)}>
          <Download data-icon="inline-start" aria-hidden="true" />
          {option.available ? t('public.download.downloadButton') : t('public.download.comingSoon')}
        </Button>
      </CardFooter>
    </Card>
  )
}

export { DownloadCard }
export type { DownloadCardProps }

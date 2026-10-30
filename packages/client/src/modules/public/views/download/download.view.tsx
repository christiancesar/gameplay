import { Package, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { DownloadArtifact, DownloadOption, DownloadPlatform } from '../../model/entities/download-option'
import { Button } from '@/shared/ui/button'

import { DownloadCard } from './card.view'
import type { PublicDestination } from '../navigation/navigation.view'

type DownloadViewProps = {
  isAuthenticated: boolean
  options: DownloadOption[]
  recommendedPlatform?: DownloadPlatform | null
  isLoading?: boolean
  isError?: boolean
  onNavigate: (destination: PublicDestination) => void
  onDownload: (platform: DownloadPlatform, format: DownloadArtifact['format'], url?: string) => void
}

function DownloadView({
  isAuthenticated,
  options,
  recommendedPlatform,
  isLoading = false,
  isError = false,
  onNavigate,
  onDownload,
}: DownloadViewProps) {
  const { t } = useTranslation()

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-emerald-600 dark:text-emerald-400 mb-4 text-sm font-semibold tracking-[0.18em] uppercase">
          {t('public.download.eyebrow')}
        </p>
        <h1 className="text-foreground text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          {t('public.download.title')}
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-relaxed">
          {t('public.download.description')}
        </p>
      </div>

      <div className="bg-muted/50 mt-10 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="text-emerald-600 dark:text-emerald-400 mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">
              {recommendedPlatform
                ? t(`public.download.recommended.${recommendedPlatform}`)
                : t('public.download.recommended.unknown')}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">{t('public.download.recommendedHint')}</p>
          </div>
        </div>
        {!isAuthenticated && (
          <Button variant="outline" onClick={() => onNavigate('sign-in')}>
            {t('public.download.signIn')}
          </Button>
        )}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {options.map((option) => (
          <DownloadCard
            key={option.platform}
            option={option}
            recommended={option.platform === recommendedPlatform}
            onDownload={onDownload}
          />
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground mt-6 text-sm">{t('public.download.loading')}</p>}
      {isError && <p className="text-muted-foreground mt-6 text-sm">{t('public.download.error')}</p>}

      <p className="text-muted-foreground mt-8 flex items-center gap-2 text-sm">
        <Package className="size-4" aria-hidden="true" />
        {t('public.download.footer')}
      </p>
    </main>
  )
}

export { DownloadView }
export type { DownloadViewProps }

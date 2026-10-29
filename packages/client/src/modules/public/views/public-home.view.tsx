import { ArrowRight, Headphones, MonitorUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

import { HomeFeature } from './home-feature.view'
import type { PublicDestination } from './public-navigation.view'

type PublicHomeViewProps = {
  isAuthenticated: boolean
  onNavigate: (destination: PublicDestination) => void
}

function PublicHomeView({ isAuthenticated, onNavigate }: PublicHomeViewProps) {
  const { t } = useTranslation()

  return (
    <main className="overflow-hidden">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:gap-20 lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <p className="text-emerald-600 dark:text-emerald-400 mb-5 text-sm font-semibold tracking-[0.18em] uppercase">
            {t('public.home.eyebrow')}
          </p>
          <h1 className="text-foreground text-5xl leading-[0.98] font-semibold tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            {t('public.home.title')}
          </h1>
          <p className="text-muted-foreground mt-7 max-w-lg text-lg leading-relaxed sm:text-xl">
            {t('public.home.description')}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => onNavigate(isAuthenticated ? 'hub' : 'sign-in')}>
              {isAuthenticated ? t('public.home.openHub') : t('public.home.getStarted')}
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate('download')}>
              {t('public.home.download')}
            </Button>
          </div>
          <p className="text-muted-foreground mt-5 text-sm">{t('public.home.noCreditCard')}</p>
        </div>

        <div className="relative">
          <div className="bg-muted/50 absolute -inset-8 -z-10 rounded-[2rem] blur-3xl" aria-hidden="true" />
          <Card className="border-border/80 bg-card/90 overflow-hidden rounded-2xl shadow-xl shadow-black/5">
            <CardHeader className="border-border/70 flex-row items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('public.home.previewLabel')}
                </p>
                <CardTitle className="mt-1 text-base">{t('public.home.previewTitle')}</CardTitle>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                {t('public.home.previewLive')}
              </span>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-[1fr_11rem]">
              <div className="bg-muted/70 relative min-h-72 overflow-hidden rounded-xl p-4">
                <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">{t('public.home.previewRoom')}</span>
                  <span className="bg-background/80 text-muted-foreground rounded-full px-2 py-1 text-[10px]">
                    {t('public.home.previewPrivate')}
                  </span>
                </div>
                <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-2">
                  <div className="bg-background/90 text-foreground rounded-lg p-3 shadow-sm">
                    <div className="bg-emerald-500/20 mb-8 size-8 rounded-full" />
                    <p className="text-xs font-medium">{t('public.home.previewYou')}</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">{t('public.home.previewSpeaking')}</p>
                  </div>
                  <div className="bg-background/70 rounded-lg p-3 opacity-75">
                    <div className="bg-muted mb-8 size-8 rounded-full" />
                    <p className="text-foreground text-xs font-medium">{t('public.home.previewFriend')}</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">{t('public.home.previewListening')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <HomeFeature
                  icon={Headphones}
                  title={t('public.home.features.voice.title')}
                  description={t('public.home.features.voice.description')}
                />
                <HomeFeature
                  icon={MonitorUp}
                  title={t('public.home.features.screen.title')}
                  description={t('public.home.features.screen.description')}
                />
                <HomeFeature
                  icon={Users}
                  title={t('public.home.features.groups.title')}
                  description={t('public.home.features.groups.description')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

export { PublicHomeView }
export type { PublicHomeViewProps }

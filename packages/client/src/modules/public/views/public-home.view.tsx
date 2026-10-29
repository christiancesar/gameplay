import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'

import { HomeProductPreview } from './home-product-preview.view'
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
          <HomeProductPreview />
        </div>
      </section>
    </main>
  )
}

export { PublicHomeView }
export type { PublicHomeViewProps }

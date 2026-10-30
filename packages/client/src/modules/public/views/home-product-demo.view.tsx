import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

import { HomeHubDemo } from './home-hub-demo.view'
import { HomeServerDemo } from './home-server-demo.view'

type DemoSlide = 'hub' | 'server' | 'streaming'
type DemoPlatform = 'windows' | 'linux' | 'macos'

const SLIDES: DemoSlide[] = ['hub', 'server', 'streaming']
const PLATFORMS: DemoPlatform[] = ['windows', 'linux', 'macos']

function HomeProductDemo() {
  const { t } = useTranslation()
  const [slide, setSlide] = useState<DemoSlide>('hub')
  const [platform, setPlatform] = useState<DemoPlatform>('windows')

  const content = {
    hub: <HomeHubDemo />,
    server: <HomeServerDemo />,
    streaming: <HomeServerDemo watching />,
  }[slide]

  return (
    <div className="relative">
      <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-2xl shadow-black/15">
        <div className="border-border/70 bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-500 size-2 rounded-full" aria-hidden="true" />
            <span className="text-foreground text-xs font-medium">Gameplay Desktop</span>
            <span className="text-muted-foreground hidden text-xs sm:inline">{t('public.home.demo.preview')}</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
            {PLATFORMS.map((item) => (
              <button
                key={item}
                type="button"
                disabled={item === 'macos'}
                onClick={() => setPlatform(item)}
                className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors data-[active=true]:bg-background data-[active=true]:text-foreground text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                data-active={platform === item}
              >
                {t(`public.home.demo.platforms.${item}`)}
                {item === 'macos' && <span className="ml-1 text-[9px]">{t('public.home.demo.soon')}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-background relative h-[30rem] overflow-hidden sm:h-[36rem]">
          <div className="absolute inset-0 origin-top scale-[0.72] sm:scale-[0.82]">{content}</div>
          <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
        </div>

        <div className="border-border/70 bg-muted/20 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
          <div className="flex items-center gap-1.5" aria-label={t('public.home.demo.slidesLabel')}>
            {SLIDES.map((item, index) => (
              <Button
                key={item}
                type="button"
                variant={slide === item ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSlide(item)}
                className="h-7 px-2.5 text-[11px]"
              >
                <span className="text-muted-foreground mr-1">0{index + 1}</span>
                {t(`public.home.demo.slides.${item}`)}
              </Button>
            ))}
          </div>
          <Badge variant="outline" className="text-[10px]">
            {t(`public.home.demo.platformStatus.${platform}`)}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export { HomeProductDemo }

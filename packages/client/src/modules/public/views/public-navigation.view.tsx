import { ArrowUpRight, Download, Map, Newspaper, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/shared/ui/navigation-menu'

type PublicDestination = 'home' | 'download' | 'roadmap' | 'changelog' | 'sign-in' | 'sign-up' | 'hub'

type PublicNavigationViewProps = {
  isAuthenticated: boolean
  onNavigate: (destination: PublicDestination) => void
}

function PublicNavigationView({ isAuthenticated, onNavigate }: PublicNavigationViewProps) {
  const { t } = useTranslation()
  const accountDestination = isAuthenticated ? 'hub' : 'sign-in'

  return (
    <header className="border-border/70 bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="focus-visible:ring-ring shrink-0 rounded-md outline-none focus-visible:ring-3"
          aria-label={t('public.nav.home')}
          onClick={() => onNavigate('home')}
        >
          <span className="font-heading text-lg font-semibold tracking-tight">{t('common.appName')}</span>
        </button>

        <NavigationMenu className="hidden md:flex" viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t('public.nav.product')}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[min(90vw,28rem)] gap-1 p-2 md:grid-cols-2">
                  <NavigationMenuLink asChild>
                    <button type="button" className="text-left" onClick={() => onNavigate('home')}>
                      <span className="font-medium">{t('public.nav.overview')}</span>
                      <span className="text-muted-foreground mt-1 block text-xs">{t('public.nav.overviewHint')}</span>
                    </button>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <button type="button" className="text-left" onClick={() => onNavigate('download')}>
                      <Download aria-hidden="true" />
                      <span>
                        <span className="font-medium">{t('public.nav.download')}</span>
                        <span className="text-muted-foreground mt-1 block text-xs">{t('public.nav.downloadHint')}</span>
                      </span>
                    </button>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t('public.nav.explore')}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[min(90vw,28rem)] gap-1 p-2 md:grid-cols-2">
                  <NavigationMenuLink asChild>
                    <button type="button" className="text-left" onClick={() => onNavigate('roadmap')}>
                      <Map aria-hidden="true" />
                      <span>
                        <span className="font-medium">{t('public.nav.roadmap')}</span>
                        <span className="text-muted-foreground mt-1 block text-xs">{t('public.nav.roadmapHint')}</span>
                      </span>
                    </button>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <button type="button" className="text-left" onClick={() => onNavigate('changelog')}>
                      <Newspaper aria-hidden="true" />
                      <span>
                        <span className="font-medium">{t('public.nav.changelog')}</span>
                        <span className="text-muted-foreground mt-1 block text-xs">
                          {t('public.nav.changelogHint')}
                        </span>
                      </span>
                    </button>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <button type="button" onClick={() => onNavigate('roadmap')}>
                  {t('public.nav.roadmap')}
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <button type="button" onClick={() => onNavigate('changelog')}>
                  {t('public.nav.changelog')}
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <nav
          className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:hidden"
          aria-label={t('public.nav.label')}
        >
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1.5 text-sm hover:text-foreground"
            onClick={() => onNavigate('download')}
          >
            {t('public.nav.download')}
          </button>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1.5 text-sm hover:text-foreground"
            onClick={() => onNavigate('roadmap')}
          >
            {t('public.nav.roadmap')}
          </button>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1.5 text-sm hover:text-foreground"
            onClick={() => onNavigate('changelog')}
          >
            {t('public.nav.changelog')}
          </button>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!isAuthenticated && (
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => onNavigate('sign-in')}>
              {t('public.nav.signIn')}
            </Button>
          )}
          <Button size="sm" onClick={() => onNavigate(accountDestination)}>
            {isAuthenticated ? (
              <Server aria-hidden="true" data-icon="inline-start" />
            ) : (
              <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
            )}
            {isAuthenticated ? t('public.nav.openHub') : t('public.nav.getStarted')}
          </Button>
        </div>
      </div>
    </header>
  )
}

export { PublicNavigationView }
export type { PublicDestination, PublicNavigationViewProps }

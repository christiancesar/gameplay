import { Download, LogIn, Map, Newspaper, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { LanguageSwitcher, type LanguageOption } from '@/shared/ui/language-switcher'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/shared/ui/navigation-menu'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

import type { PublicDestination } from '../model/public-destination'

type PublicNavigationViewProps = {
  isAuthenticated: boolean
  onNavigate: (destination: PublicDestination) => void
  theme: 'dark' | 'light'
  language: string
  languageOptions: readonly LanguageOption[]
  onToggleTheme: () => void
  onLanguageChange: (language: string) => void
}

function PublicNavigationView({
  isAuthenticated,
  onNavigate,
  theme,
  language,
  languageOptions,
  onToggleTheme,
  onLanguageChange,
}: PublicNavigationViewProps) {
  const { t } = useTranslation()
  const accountDestination = isAuthenticated ? 'hub' : 'sign-in'

  return (
    <header className="border-border/70 bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="focus-visible:ring-ring shrink-0 rounded-md outline-none focus-visible:ring-3"
          aria-label={t('public.nav.home')}
          onClick={() => onNavigate('home')}
        >
          <span className="font-heading text-lg font-semibold tracking-tight">{t('common.appName')}</span>
        </button>

        <NavigationMenu className="absolute left-1/2 hidden -translate-x-1/2 lg:flex" viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <button type="button" onClick={() => onNavigate('home')}>
                  {t('public.nav.homeLink')}
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t('public.nav.product')}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[min(90vw,18rem)] p-2">
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
          </NavigationMenuList>
        </NavigationMenu>

        <nav
          className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:hidden"
          aria-label={t('public.nav.label')}
        >
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1.5 text-sm hover:text-foreground"
            onClick={() => onNavigate('home')}
          >
            {t('public.nav.homeLink')}
          </button>
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
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
            labels={{ toLight: t('common.theme.toLight'), toDark: t('common.theme.toDark') }}
          />
          <LanguageSwitcher
            value={language}
            options={languageOptions}
            onChange={onLanguageChange}
            ariaLabel={t('common.language')}
            className="hidden sm:flex"
          />
          <Button size="sm" onClick={() => onNavigate(accountDestination)}>
            {isAuthenticated ? (
              <Server aria-hidden="true" data-icon="inline-start" />
            ) : (
              <LogIn aria-hidden="true" data-icon="inline-start" />
            )}
            {isAuthenticated ? t('public.nav.openHub') : t('public.nav.signIn')}
          </Button>
        </div>
      </div>
    </header>
  )
}

export { PublicNavigationView }
export type { PublicDestination, PublicNavigationViewProps }

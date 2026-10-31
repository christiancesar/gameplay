import {
  ArrowLeftIcon,
  BugIcon,
  CableIcon,
  CpuIcon,
  GlobeIcon,
  KeyRoundIcon,
  MegaphoneIcon,
  RadioTowerIcon,
  ServerIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ADMIN_TABS, type AdminTab } from '@/modules/admin/model/admin-tab.constants'
import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'
import { LanguageSwitcher, type LanguageOption } from '@/shared/ui/language-switcher'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

const ICONS = {
  users: UsersIcon,
  servers: ServerIcon,
  hardware: CpuIcon,
  limits: SlidersHorizontalIcon,
  media: RadioTowerIcon,
  keys: KeyRoundIcon,
  announcements: MegaphoneIcon,
  development: BugIcon,
  mcp: CableIcon,
  public: GlobeIcon,
} as const

type AdminLayoutViewProps = {
  tab: AdminTab
  children: ReactNode
  onTabChange: (tab: AdminTab) => void
  onBackToHub: () => void
  theme: 'dark' | 'light'
  language: string
  languageOptions: readonly LanguageOption[]
  onThemeChange: (theme: 'dark' | 'light') => void
  onLanguageChange: (language: string | null) => void
}

function AdminLayoutView({
  tab,
  children,
  onTabChange,
  onBackToHub,
  theme,
  language,
  languageOptions,
  onThemeChange,
  onLanguageChange,
}: AdminLayoutViewProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-background text-foreground min-h-dvh">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <BrandLogo className="w-16" />
        <h1 className="text-lg font-medium">{t('admin.title')}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle
            theme={theme}
            onToggle={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            labels={{ toLight: t('common.theme.toLight'), toDark: t('common.theme.toDark') }}
          />
          <LanguageSwitcher
            value={language ?? 'en'}
            options={languageOptions}
            onChange={onLanguageChange}
            ariaLabel={t('common.language')}
          />
          <Button variant="ghost" size="sm" onClick={onBackToHub}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden />
            {t('common.backToHub')}
          </Button>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={(value) => onTabChange(value as AdminTab)}>
          {/* The tabs do not fit a phone: the strip scrolls sideways. */}
          <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden">
            {ADMIN_TABS.map((id) => {
              const Icon = ICONS[id]
              return (
                <TabsTrigger key={id} value={id}>
                  <Icon aria-hidden />
                  {t(`admin.tabs.${id}`)}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}

export { ADMIN_TABS, AdminLayoutView }
export type { AdminLayoutViewProps, AdminTab }

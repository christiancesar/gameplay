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
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

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
}

function AdminLayoutView({ tab, children, onTabChange, onBackToHub }: AdminLayoutViewProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-background text-foreground min-h-dvh">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <BrandLogo className="w-16" />
        <h1 className="text-lg font-medium">{t('admin.title')}</h1>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onBackToHub}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden />
          {t('common.backToHub')}
        </Button>
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

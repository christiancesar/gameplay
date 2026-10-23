import { ArrowLeftIcon, CpuIcon, KeyRoundIcon, ServerIcon, SlidersHorizontalIcon, UsersIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const ADMIN_TABS = ['users', 'servers', 'hardware', 'limits', 'keys'] as const
type AdminTab = (typeof ADMIN_TABS)[number]

const ICONS = { users: UsersIcon, servers: ServerIcon, hardware: CpuIcon, limits: SlidersHorizontalIcon, keys: KeyRoundIcon } as const

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
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <Tabs value={tab} onValueChange={(value) => onTabChange(value as AdminTab)}>
          <TabsList>
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
        <main>{children}</main>
      </div>
    </div>
  )
}

export { ADMIN_TABS, AdminLayoutView }
export type { AdminLayoutViewProps, AdminTab }

import { FileTextIcon, GitPullRequestIcon, MapIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { PUBLIC_ADMIN_TABS, type PublicAdminTab } from '@/modules/admin/model/public-admin.constants'
import { Button } from '@/shared/ui/button'
import { cn } from 'cn'

const ICONS = {
  roadmap: MapIcon,
  changelog: FileTextIcon,
  'feature-requests': GitPullRequestIcon,
} as const

type PublicAdminLayoutViewProps = {
  tab: PublicAdminTab
  children: ReactNode
  onTabChange: (tab: PublicAdminTab) => void
}

function PublicAdminLayoutView({ tab, children, onTabChange }: PublicAdminLayoutViewProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <aside className="border-border bg-card rounded-lg border p-2">
        <p className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-[0.16em] uppercase">
          {t('admin.public.title')}
        </p>
        <nav aria-label={t('admin.public.navigation')} className="flex gap-1 overflow-x-auto lg:flex-col">
          {PUBLIC_ADMIN_TABS.map((id) => {
            const Icon = ICONS[id]
            return (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                className={cn('justify-start whitespace-nowrap', tab === id && 'bg-muted')}
                onClick={() => onTabChange(id)}
              >
                <Icon data-icon="inline-start" aria-hidden />
                {t(`admin.public.tabs.${id}`)}
              </Button>
            )
          })}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  )
}

export { PublicAdminLayoutView }
export type { PublicAdminLayoutViewProps }

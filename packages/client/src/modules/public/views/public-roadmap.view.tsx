import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { RoadmapItem, RoadmapStatus } from '../model/entities/roadmap-item'
import { RoadmapColumn } from './roadmap-column.view'

type PublicRoadmapViewProps = {
  items: RoadmapItem[]
}

const ROADMAP_STATUSES: RoadmapStatus[] = ['now', 'next', 'exploring', 'done']

function PublicRoadmapView({ items }: PublicRoadmapViewProps) {
  const { t } = useTranslation()
  const itemsByStatus = useMemo(
    () =>
      Object.fromEntries(ROADMAP_STATUSES.map((status) => [status, items.filter((item) => item.status === status)])),
    [items],
  ) as Record<RoadmapStatus, RoadmapItem[]>

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-emerald-600 dark:text-emerald-400 mb-4 text-sm font-semibold tracking-[0.18em] uppercase">
          {t('public.roadmap.eyebrow')}
        </p>
        <h1 className="text-foreground text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          {t('public.roadmap.title')}
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-relaxed">{t('public.roadmap.description')}</p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {ROADMAP_STATUSES.map((status) => (
          <RoadmapColumn key={status} status={status} items={itemsByStatus[status]} />
        ))}
      </div>
    </main>
  )
}

export { PublicRoadmapView }
export type { PublicRoadmapViewProps }

import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'

import type { RoadmapItem, RoadmapStatus } from '../../model/entities/roadmap-item'

type RoadmapColumnProps = {
  status: RoadmapStatus
  items: RoadmapItem[]
}

function RoadmapColumn({ status, items }: RoadmapColumnProps) {
  const { t } = useTranslation()
  const statusClass = {
    now: 'bg-emerald-500',
    next: 'bg-amber-500',
    exploring: 'bg-sky-500',
    done: 'bg-muted-foreground',
  }[status]

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby={`roadmap-${status}`}>
      <div className="flex items-center gap-2">
        <span className={cn('size-2 rounded-full', statusClass)} aria-hidden="true" />
        <h2 id={`roadmap-${status}`} className="font-heading text-lg font-medium">
          {t(`public.roadmap.status.${status}`)}
        </h2>
        <Badge variant="outline" className="ml-auto">
          {items.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.id} className="rounded-xl">
            <CardHeader className="gap-2 pb-3">
              <CardTitle className="text-base">
                {t(`public.roadmap.items.${item.titleKey}`, { defaultValue: item.titleKey })}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-relaxed">
              {t(`public.roadmap.items.${item.descriptionKey}`, { defaultValue: item.descriptionKey })}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export { RoadmapColumn }
export type { RoadmapColumnProps }

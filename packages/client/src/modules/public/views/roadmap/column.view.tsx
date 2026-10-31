import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'

import type { RoadmapItem, RoadmapStatus } from '@gameplay/contracts'

type RoadmapColumnProps = {
  status: RoadmapStatus
  items: RoadmapItem[]
  isAuthenticated: boolean
  isVoting: boolean
  onRequireAuth: () => void
  onVote: (itemId: string, votedByMe: boolean) => void
}

function RoadmapColumn({ status, items, isAuthenticated, isVoting, onRequireAuth, onVote }: RoadmapColumnProps) {
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
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-relaxed">{item.description}</CardContent>
            <CardContent className="flex items-center justify-between gap-3 pt-0">
              <span className="text-muted-foreground text-xs">
                {t('public.roadmap.votes', { count: item.voteCount })}
              </span>
              <Button
                type="button"
                variant={item.votedByMe ? 'success' : 'outline'}
                size="sm"
                disabled={isVoting}
                onClick={() => (isAuthenticated ? onVote(item.id, item.votedByMe) : onRequireAuth())}
              >
                {item.votedByMe ? t('public.roadmap.removeVote') : t('public.roadmap.vote')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export { RoadmapColumn }
export type { RoadmapColumnProps }

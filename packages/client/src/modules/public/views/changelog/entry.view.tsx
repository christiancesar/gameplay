import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ChangelogEntry } from '../../model/entities/changelog-entry'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'

type ChangelogEntryViewProps = {
  entry: ChangelogEntry
  onBack: () => void
}

function ChangelogEntryView({ entry, onBack }: ChangelogEntryViewProps) {
  const { t } = useTranslation()

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <Button variant="ghost" className="-ml-2 mb-10" onClick={onBack}>
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        {t('public.changelog.back')}
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{entry.version}</Badge>
        {entry.tagKeys.map((tagKey) => (
          <Badge key={tagKey} variant="outline">
            {t(`public.changelog.tags.${tagKey}`, { defaultValue: tagKey })}
          </Badge>
        ))}
      </div>
      <h1 className="text-foreground mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
        {t(`public.changelog.entries.${entry.titleKey}`, { defaultValue: entry.titleKey })}
      </h1>
      <div className="text-muted-foreground mt-5 flex items-center gap-2 text-sm">
        <CalendarDays className="size-4" aria-hidden="true" />
        {t('public.changelog.date', { date: entry.date })}
      </div>
      <Separator className="my-10" />
      <div className="text-foreground text-lg leading-relaxed">
        <p>{t(`public.changelog.entries.${entry.bodyKey}`, { defaultValue: entry.bodyKey })}</p>
      </div>
    </article>
  )
}

export { ChangelogEntryView }
export type { ChangelogEntryViewProps }

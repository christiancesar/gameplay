import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ChangelogEntry } from '../model/entities/changelog-entry'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

import { ChangelogEntryView } from './changelog-entry.view'

type PublicChangelogViewProps = {
  entries: ChangelogEntry[]
  selectedSlug?: string
  onSearchChange?: (value: string) => void
  onSelectEntry: (slug: string) => void
  onBack: () => void
}

function PublicChangelogView({
  entries,
  selectedSlug,
  onSearchChange,
  onSelectEntry,
  onBack,
}: PublicChangelogViewProps) {
  const { t } = useTranslation()
  const selectedEntry = entries.find((entry) => entry.slug === selectedSlug)

  if (selectedEntry) return <ChangelogEntryView entry={selectedEntry} onBack={onBack} />

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-emerald-600 dark:text-emerald-400 mb-4 text-sm font-semibold tracking-[0.18em] uppercase">
            {t('public.changelog.eyebrow')}
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            {t('public.changelog.title')}
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">{t('public.changelog.description')}</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            aria-label={t('public.changelog.search')}
            placeholder={t('public.changelog.search')}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-4">
        {entries.map((entry) => (
          <Card key={entry.slug}>
            <CardHeader>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                <span>{t('public.changelog.date', { date: entry.date })}</span>
                <span aria-hidden="true">·</span>
                <span>{entry.version}</span>
              </div>
              <CardTitle>
                <button type="button" className="text-left hover:underline" onClick={() => onSelectEntry(entry.slug)}>
                  {t(`public.changelog.entries.${entry.titleKey}`, { defaultValue: entry.titleKey })}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground max-w-3xl leading-relaxed">
                {t(`public.changelog.entries.${entry.summaryKey}`, { defaultValue: entry.summaryKey })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

export { PublicChangelogView }
export type { PublicChangelogViewProps }

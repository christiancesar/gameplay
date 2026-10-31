import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ChangelogEntry } from '../model/entities/changelog-entry'
import { publicChangelogQueryOptions } from '../model/services/public-content.query'

function usePublicChangelogViewModel(selectedSlug?: string) {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const changelog = useQuery(publicChangelogQueryOptions)
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const entries = useMemo<ChangelogEntry[]>(
    () =>
      (changelog.data?.entries ?? []).map((entry) => ({
        slug: entry.slug,
        date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
          new Date(entry.publishedAt ?? entry.createdAt),
        ),
        version: entry.version,
        title: entry.title,
        summary: entry.summary,
        body: entry.body,
        tags: entry.tags,
      })),
    [changelog.data?.entries, i18n.language],
  )
  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) =>
        [entry.version, entry.date, entry.slug, entry.title, entry.summary, entry.body, ...entry.tags].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch),
        ),
      ),
    [entries, normalizedSearch],
  )

  return {
    entries: filteredEntries,
    selectedSlug,
    isLoading: changelog.isLoading,
    hasError: changelog.isError,
    onSearchChange: setSearch,
    onSelectEntry: (slug: string) => void navigate({ to: '/changelog/$slug', params: { slug } }),
    onBack: () => void navigate({ to: '/changelog' }),
  }
}

export { usePublicChangelogViewModel }

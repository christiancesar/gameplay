import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { CHANGELOG_ENTRIES } from '../model/seeds/changelog-seed'

function usePublicChangelogViewModel(selectedSlug?: string) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const entries = useMemo(
    () =>
      CHANGELOG_ENTRIES.filter((entry) =>
        [entry.version, entry.date, entry.slug, entry.titleKey, entry.summaryKey].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch),
        ),
      ),
    [normalizedSearch],
  )

  return {
    entries,
    selectedSlug,
    onSearchChange: setSearch,
    onSelectEntry: (slug: string) => void navigate({ to: '/changelog/$slug', params: { slug } }),
    onBack: () => void navigate({ to: '/changelog' }),
  }
}

export { usePublicChangelogViewModel }

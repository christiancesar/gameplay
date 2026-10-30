import { createFileRoute } from '@tanstack/react-router'

import { PublicChangelogEntryScreen } from '@/modules/public/screens/public-changelog-entry.screen'

export const Route = createFileRoute('/changelog/$slug')({
  component: PublicChangelogEntryScreen,
})

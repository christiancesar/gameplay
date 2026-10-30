import { createFileRoute } from '@tanstack/react-router'

import { ChangelogEntryScreen } from '@/modules/public/screens/changelog/entry.screen'

export const Route = createFileRoute('/changelog/$slug')({
  component: ChangelogEntryScreen,
})

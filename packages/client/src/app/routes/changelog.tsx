import { createFileRoute } from '@tanstack/react-router'

import { ChangelogScreen } from '@/modules/public/screens/changelog/changelog.screen'

export const Route = createFileRoute('/changelog')({
  component: ChangelogScreen,
})

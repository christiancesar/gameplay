import { createFileRoute } from '@tanstack/react-router'

import { PublicChangelogScreen } from '@/modules/public/screens/public-changelog.screen'

export const Route = createFileRoute('/changelog')({
  component: PublicChangelogScreen,
})

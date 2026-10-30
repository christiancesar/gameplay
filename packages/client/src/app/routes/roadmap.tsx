import { createFileRoute } from '@tanstack/react-router'

import { PublicRoadmapScreen } from '@/modules/public/screens/public-roadmap.screen'

export const Route = createFileRoute('/roadmap')({
  component: PublicRoadmapScreen,
})

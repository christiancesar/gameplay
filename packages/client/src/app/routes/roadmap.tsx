import { createFileRoute } from '@tanstack/react-router'

import { RoadmapScreen } from '@/modules/public/screens/roadmap/roadmap.screen'

export const Route = createFileRoute('/roadmap')({
  component: RoadmapScreen,
})

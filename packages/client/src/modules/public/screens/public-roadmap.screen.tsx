import { Navigate } from '@tanstack/react-router'

import { PublicRoadmapContentScreen } from './public-roadmap-content.screen'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'

function PublicRoadmapScreen() {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <PublicRoadmapContentScreen />
}

export { PublicRoadmapScreen }

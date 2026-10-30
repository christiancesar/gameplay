import { Navigate } from '@tanstack/react-router'

import { RoadmapContentScreen } from './content.screen'
import { usePublicHostViewModel } from '../../view-models/use-public-host.view-model'

function RoadmapScreen() {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <RoadmapContentScreen />
}

export { RoadmapScreen }

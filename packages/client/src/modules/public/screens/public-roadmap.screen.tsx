import { Navigate } from '@tanstack/react-router'

import { PublicNavigationView } from '../views/public-navigation.view'
import { PublicRoadmapView } from '../views/public-roadmap.view'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'
import { usePublicRoadmapViewModel } from '../view-models/use-public-roadmap.view-model'

function PublicRoadmapScreen() {
  const navigation = usePublicNavigationViewModel()
  const roadmap = usePublicRoadmapViewModel()
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return (
    <>
      <PublicNavigationView {...navigation} />
      <PublicRoadmapView {...roadmap} />
    </>
  )
}

export { PublicRoadmapScreen }

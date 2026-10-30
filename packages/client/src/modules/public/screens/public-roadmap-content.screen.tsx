import { PublicNavigationView } from '../views/public-navigation.view'
import { PublicRoadmapView } from '../views/public-roadmap.view'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'
import { usePublicRoadmapViewModel } from '../view-models/use-public-roadmap.view-model'

function PublicRoadmapContentScreen() {
  const navigation = usePublicNavigationViewModel()
  const roadmap = usePublicRoadmapViewModel()

  return (
    <>
      <PublicNavigationView {...navigation} />
      <PublicRoadmapView {...roadmap} />
    </>
  )
}

export { PublicRoadmapContentScreen }

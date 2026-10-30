import { NavigationView } from '../../views/navigation/navigation.view'
import { RoadmapView } from '../../views/roadmap/roadmap.view'
import { usePublicNavigationViewModel } from '../../view-models/use-public-navigation.view-model'
import { usePublicRoadmapViewModel } from '../../view-models/use-public-roadmap.view-model'

function RoadmapContentScreen() {
  const navigation = usePublicNavigationViewModel()
  const roadmap = usePublicRoadmapViewModel()

  return (
    <>
      <NavigationView {...navigation} />
      <RoadmapView {...roadmap} />
    </>
  )
}

export { RoadmapContentScreen }

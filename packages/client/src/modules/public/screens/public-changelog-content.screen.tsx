import { PublicChangelogView } from '../views/public-changelog.view'
import { PublicNavigationView } from '../views/public-navigation.view'
import { usePublicChangelogViewModel } from '../view-models/use-public-changelog.view-model'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicChangelogContentScreen({ selectedSlug }: { selectedSlug?: string }) {
  const navigation = usePublicNavigationViewModel()
  const changelog = usePublicChangelogViewModel(selectedSlug)

  return (
    <>
      <PublicNavigationView {...navigation} />
      <PublicChangelogView {...changelog} />
    </>
  )
}

export { PublicChangelogContentScreen }

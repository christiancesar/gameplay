import { ChangelogView } from '../views/changelog/changelog.view'
import { NavigationView } from '../views/navigation/navigation.view'
import { usePublicChangelogViewModel } from '../view-models/use-public-changelog.view-model'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicChangelogContentScreen({ selectedSlug }: { selectedSlug?: string }) {
  const navigation = usePublicNavigationViewModel()
  const changelog = usePublicChangelogViewModel(selectedSlug)

  return (
    <>
      <NavigationView {...navigation} />
      <ChangelogView {...changelog} />
    </>
  )
}

export { PublicChangelogContentScreen }

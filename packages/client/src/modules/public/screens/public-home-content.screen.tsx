import { PublicHomeView } from '../views/public-home.view'
import { PublicNavigationView } from '../views/public-navigation.view'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicHomeContentScreen() {
  const navigation = usePublicNavigationViewModel()

  return (
    <>
      <PublicNavigationView {...navigation} />
      <PublicHomeView isAuthenticated={navigation.isAuthenticated} onNavigate={navigation.onNavigate} />
    </>
  )
}

export { PublicHomeContentScreen }

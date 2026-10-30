import { HomeView } from '../views/home/home.view'
import { NavigationView } from '../views/navigation/navigation.view'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicHomeContentScreen() {
  const navigation = usePublicNavigationViewModel()

  return (
    <>
      <NavigationView {...navigation} />
      <HomeView isAuthenticated={navigation.isAuthenticated} onNavigate={navigation.onNavigate} />
    </>
  )
}

export { PublicHomeContentScreen }

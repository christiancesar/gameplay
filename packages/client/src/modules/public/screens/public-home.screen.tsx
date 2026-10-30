import { Navigate } from '@tanstack/react-router'

import { PublicHomeView } from '../views/public-home.view'
import { PublicNavigationView } from '../views/public-navigation.view'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicHomeScreen() {
  const navigation = usePublicNavigationViewModel()
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return (
    <>
      <PublicNavigationView {...navigation} />
      <PublicHomeView isAuthenticated={navigation.isAuthenticated} onNavigate={navigation.onNavigate} />
    </>
  )
}

export { PublicHomeScreen }

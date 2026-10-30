import { Navigate } from '@tanstack/react-router'

import { PublicHomeContentScreen } from './public-home-content.screen'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'

function PublicHomeScreen() {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <PublicHomeContentScreen />
}

export { PublicHomeScreen }

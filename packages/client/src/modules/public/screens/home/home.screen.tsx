import { Navigate } from '@tanstack/react-router'

import { HomeContentScreen } from './content.screen'
import { usePublicHostViewModel } from '../../view-models/use-public-host.view-model'

function HomeScreen() {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <HomeContentScreen />
}

export { HomeScreen }

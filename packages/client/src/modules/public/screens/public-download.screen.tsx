import { Navigate } from '@tanstack/react-router'

import { PublicDownloadContentScreen } from './public-download-content.screen'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'

function PublicDownloadScreen() {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <PublicDownloadContentScreen />
}

export { PublicDownloadScreen }

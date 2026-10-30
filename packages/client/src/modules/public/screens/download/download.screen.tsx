import { Navigate } from '@tanstack/react-router'

import { DownloadContentScreen } from './content.screen'
import { usePublicHostViewModel } from '../../view-models/use-public-host.view-model'

function DownloadScreen() {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <DownloadContentScreen />
}

export { DownloadScreen }

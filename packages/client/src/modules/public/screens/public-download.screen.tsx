import { Navigate } from '@tanstack/react-router'

import { PublicDownloadView } from '../views/public-download.view'
import { PublicNavigationView } from '../views/public-navigation.view'
import { usePublicDownloadViewModel } from '../view-models/use-public-download.view-model'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicDownloadScreen() {
  const navigation = usePublicNavigationViewModel()
  const download = usePublicDownloadViewModel()
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return (
    <>
      <PublicNavigationView {...navigation} />
      <PublicDownloadView
        {...download}
        isAuthenticated={navigation.isAuthenticated}
        onNavigate={navigation.onNavigate}
        onDownload={() => undefined}
      />
    </>
  )
}

export { PublicDownloadScreen }

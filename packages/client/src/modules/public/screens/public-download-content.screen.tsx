import { PublicDownloadView } from '../views/public-download.view'
import { PublicNavigationView } from '../views/public-navigation.view'
import { usePublicDownloadViewModel } from '../view-models/use-public-download.view-model'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicDownloadContentScreen() {
  const navigation = usePublicNavigationViewModel()
  const download = usePublicDownloadViewModel()

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

export { PublicDownloadContentScreen }

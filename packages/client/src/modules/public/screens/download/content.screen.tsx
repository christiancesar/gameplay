import { DownloadView } from '../../views/download/download.view'
import { NavigationView } from '../../views/navigation/navigation.view'
import { usePublicDownloadViewModel } from '../../view-models/use-public-download.view-model'
import { usePublicNavigationViewModel } from '../../view-models/use-public-navigation.view-model'

function DownloadContentScreen() {
  const navigation = usePublicNavigationViewModel()
  const download = usePublicDownloadViewModel()

  return (
    <>
      <NavigationView {...navigation} />
      <DownloadView
        {...download}
        isAuthenticated={navigation.isAuthenticated}
        onNavigate={navigation.onNavigate}
        onDownload={(_, __, url) => {
          if (url) window.open(url, '_blank', 'noopener,noreferrer')
        }}
      />
    </>
  )
}

export { DownloadContentScreen }

import { useConnectionBannerViewModel } from '../view-models/use-connection-banner.view-model'
import { ConnectionBannerView } from '../views/connection-banner.view'

/** Mounted in the root layout. The status is `online` (nothing shown) unless a logged-in socket is down. */
export function ConnectionBannerScreen() {
  const { status } = useConnectionBannerViewModel()
  return <ConnectionBannerView status={status} />
}

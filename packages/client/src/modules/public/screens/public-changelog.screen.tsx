import { Navigate } from '@tanstack/react-router'

import { PublicChangelogContentScreen } from './public-changelog-content.screen'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'

function PublicChangelogScreen({ selectedSlug }: { selectedSlug?: string }) {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <PublicChangelogContentScreen selectedSlug={selectedSlug} />
}

export { PublicChangelogScreen }

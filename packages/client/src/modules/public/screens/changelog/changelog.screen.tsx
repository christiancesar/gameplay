import { Navigate } from '@tanstack/react-router'

import { ChangelogContentScreen } from './content.screen'
import { usePublicHostViewModel } from '../../view-models/use-public-host.view-model'

function ChangelogScreen({ selectedSlug }: { selectedSlug?: string }) {
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return <ChangelogContentScreen selectedSlug={selectedSlug} />
}

export { ChangelogScreen }

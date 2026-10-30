import { Navigate } from '@tanstack/react-router'

import { PublicChangelogView } from '../views/public-changelog.view'
import { PublicNavigationView } from '../views/public-navigation.view'
import { usePublicChangelogViewModel } from '../view-models/use-public-changelog.view-model'
import { usePublicHostViewModel } from '../view-models/use-public-host.view-model'
import { usePublicNavigationViewModel } from '../view-models/use-public-navigation.view-model'

function PublicChangelogScreen({ selectedSlug }: { selectedSlug?: string }) {
  const navigation = usePublicNavigationViewModel()
  const changelog = usePublicChangelogViewModel(selectedSlug)
  const { isDesktop } = usePublicHostViewModel()

  if (isDesktop) return <Navigate to="/sign-in" replace />

  return (
    <>
      <PublicNavigationView {...navigation} />
      <PublicChangelogView {...changelog} />
    </>
  )
}

export { PublicChangelogScreen }

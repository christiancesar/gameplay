import { useParams } from '@tanstack/react-router'

import { PublicChangelogScreen } from './public-changelog.screen'

function PublicChangelogEntryScreen() {
  const { slug } = useParams({ from: '/changelog/$slug' })
  return <PublicChangelogScreen selectedSlug={slug} />
}

export { PublicChangelogEntryScreen }

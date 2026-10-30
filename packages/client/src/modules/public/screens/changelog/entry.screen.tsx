import { useParams } from '@tanstack/react-router'

import { ChangelogScreen } from './changelog.screen'

function ChangelogEntryScreen() {
  const { slug } = useParams({ from: '/changelog/$slug' })
  return <ChangelogScreen selectedSlug={slug} />
}

export { ChangelogEntryScreen }

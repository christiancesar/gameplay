import { queryOptions } from '@tanstack/react-query'

import { publicContentKeys } from './public-content.keys'
import { listPublicChangelog, listPublicRoadmap } from './public-content.service'

const publicRoadmapQueryOptions = queryOptions({
  queryKey: publicContentKeys.roadmap(),
  queryFn: listPublicRoadmap,
})

const publicChangelogQueryOptions = queryOptions({
  queryKey: publicContentKeys.changelog(),
  queryFn: listPublicChangelog,
})

export { publicChangelogQueryOptions, publicRoadmapQueryOptions }

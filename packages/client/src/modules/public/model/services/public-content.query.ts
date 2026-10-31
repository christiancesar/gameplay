import { queryOptions } from '@tanstack/react-query'

import { publicContentKeys } from './public-content.keys'
import { listPublicRoadmap } from './public-content.service'

const publicRoadmapQueryOptions = queryOptions({
  queryKey: publicContentKeys.roadmap(),
  queryFn: listPublicRoadmap,
})

export { publicRoadmapQueryOptions }

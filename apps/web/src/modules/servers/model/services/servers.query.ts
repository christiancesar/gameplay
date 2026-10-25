import { queryOptions } from '@tanstack/react-query'

import { listMyServers } from './servers.service'
import { serversKeys } from './servers.keys'

/** Servers the user belongs to (Hub list). */
const serversListQueryOptions = queryOptions({
  queryKey: serversKeys.list(),
  queryFn: listMyServers,
})

export { serversListQueryOptions }

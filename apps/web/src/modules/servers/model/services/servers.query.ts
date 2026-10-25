import { queryOptions } from '@tanstack/react-query'

import { getServer, listMyServers, listPendingJoinRequests, listServerMembers } from './servers.service'
import { serversKeys } from './servers.keys'

/** Servers the user belongs to (Hub list). */
const serversListQueryOptions = queryOptions({
  queryKey: serversKeys.list(),
  queryFn: listMyServers,
})

const serverDetailQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serversKeys.detail(serverId), queryFn: () => getServer(serverId) })

const serverMembersQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serversKeys.members(serverId), queryFn: () => listServerMembers(serverId) })

const serverJoinRequestsQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serversKeys.joinRequests(serverId), queryFn: () => listPendingJoinRequests(serverId) })

export { serverDetailQueryOptions, serverJoinRequestsQueryOptions, serverMembersQueryOptions, serversListQueryOptions }

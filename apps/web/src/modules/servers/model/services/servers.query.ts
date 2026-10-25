import { queryOptions } from '@tanstack/react-query'

import {
  getMyLimits,
  getServer,
  listJoinRequests,
  listMyServers,
  listServerInvites,
  listServerMembers,
} from './servers.service'
import { serversKeys } from './servers.keys'

/** Servers the user belongs to (Hub list). */
const serversListQueryOptions = queryOptions({
  queryKey: serversKeys.list(),
  queryFn: listMyServers,
})

/** Server limit in force for the user and how many servers they own. */
const myLimitsQueryOptions = queryOptions({
  queryKey: serversKeys.myLimits(),
  queryFn: getMyLimits,
})

const serverDetailQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serversKeys.detail(serverId), queryFn: () => getServer(serverId) })

const serverMembersQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serversKeys.members(serverId), queryFn: () => listServerMembers(serverId) })

const serverInvitesQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serversKeys.invites(serverId), queryFn: () => listServerInvites(serverId) })

const joinRequestsQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serversKeys.joinRequests(serverId), queryFn: () => listJoinRequests(serverId) })

export {
  joinRequestsQueryOptions,
  myLimitsQueryOptions,
  serverDetailQueryOptions,
  serverInvitesQueryOptions,
  serverMembersQueryOptions,
  serversListQueryOptions,
}

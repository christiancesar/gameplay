import { queryOptions } from '@tanstack/react-query'
import type { AdminListQuery } from '@gameplay/contracts'

import { adminKeys } from './admin.keys'
import {
  getAdminServer,
  getHardwareSummary,
  getPlatformSettings,
  listAdminDevices,
  listAdminServers,
  listAdminSessions,
  listAdminUsers,
  listRegistrationInvites,
} from './admin.service'

const adminUsersQueryOptions = (query: AdminListQuery = {}) =>
  queryOptions({ queryKey: adminKeys.users(query), queryFn: () => listAdminUsers(query) })

const adminUserSessionsQueryOptions = (userId: string) =>
  queryOptions({ queryKey: adminKeys.userSessions(userId), queryFn: () => listAdminSessions(userId) })

const adminUserDevicesQueryOptions = (userId: string) =>
  queryOptions({ queryKey: adminKeys.userDevices(userId), queryFn: () => listAdminDevices(userId) })

const adminServersQueryOptions = (query: AdminListQuery = {}) =>
  queryOptions({ queryKey: adminKeys.servers(query), queryFn: () => listAdminServers(query) })

const adminServerDetailQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: adminKeys.serverDetail(serverId), queryFn: () => getAdminServer(serverId) })

const hardwareSummaryQueryOptions = queryOptions({
  queryKey: adminKeys.hardwareSummary(),
  queryFn: getHardwareSummary,
})

const platformSettingsQueryOptions = queryOptions({ queryKey: adminKeys.settings(), queryFn: getPlatformSettings })

const registrationInvitesQueryOptions = queryOptions({
  queryKey: adminKeys.registrationInvites(),
  queryFn: listRegistrationInvites,
})

export {
  adminServerDetailQueryOptions,
  adminServersQueryOptions,
  adminUserDevicesQueryOptions,
  adminUserSessionsQueryOptions,
  adminUsersQueryOptions,
  hardwareSummaryQueryOptions,
  platformSettingsQueryOptions,
  registrationInvitesQueryOptions,
}

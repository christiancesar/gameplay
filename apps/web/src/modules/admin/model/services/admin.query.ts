import { queryOptions } from '@tanstack/react-query'
import type { AdminListQuery } from '@gameplay/contracts'

import { adminKeys } from './admin.keys'
import {
  getAdminMedia,
  getAdminServer,
  getHardwareSummary,
  getMediaImpact,
  getServerMediaOverrides,
  getPlatformSettings,
  listAdminDevices,
  listAdminServers,
  listAdminSessions,
  listAdminUsers,
  listAllAdminDevices,
  listRegistrationInvites,
} from './admin.service'

const adminUsersQueryOptions = (query: AdminListQuery = {}) =>
  queryOptions({ queryKey: adminKeys.users(query), queryFn: () => listAdminUsers(query) })

const adminUserSessionsQueryOptions = (userId: string) =>
  queryOptions({ queryKey: adminKeys.userSessions(userId), queryFn: () => listAdminSessions(userId) })

/** Every device report of the base, newest first (the Hardware tab). */
const adminDevicesQueryOptions = (query: AdminListQuery = {}) =>
  queryOptions({ queryKey: adminKeys.devices(query), queryFn: () => listAllAdminDevices(query) })

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

const adminMediaQueryOptions = queryOptions({ queryKey: adminKeys.media(), queryFn: getAdminMedia })

const mediaImpactQueryOptions = (serverId: string | null) =>
  queryOptions({ queryKey: adminKeys.mediaImpact(serverId), queryFn: () => getMediaImpact(serverId), staleTime: 0 })

const serverMediaOverridesQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: adminKeys.serverMedia(serverId), queryFn: () => getServerMediaOverrides(serverId) })

export {
  adminDevicesQueryOptions,
  adminMediaQueryOptions,
  adminServerDetailQueryOptions,
  adminServersQueryOptions,
  adminUserDevicesQueryOptions,
  adminUserSessionsQueryOptions,
  adminUsersQueryOptions,
  hardwareSummaryQueryOptions,
  mediaImpactQueryOptions,
  platformSettingsQueryOptions,
  registrationInvitesQueryOptions,
  serverMediaOverridesQueryOptions,
}

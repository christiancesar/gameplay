import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { AdminListQuery, RealtimeUsageQuery } from '@gameplay/contracts'

import { adminKeys } from './admin.keys'
import {
  getAdminMedia,
  getAdminServer,
  getHardwareSummary,
  getMediaImpact,
  getRealtimeUsage,
  getServerMediaOverrides,
  getPlatformSettings,
  listAdminDevices,
  listAdminServers,
  listAdminSessions,
  listAdminUsers,
  listAllAdminDevices,
  listRegistrationInvites,
  listAdminPublicChangelog,
  listAdminPublicFeatureRequests,
  listAdminPublicRoadmap,
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

/** Consumo do período: mantém o gráfico anterior na tela enquanto o novo período carrega. */
const mediaUsageQueryOptions = (query: RealtimeUsageQuery) =>
  queryOptions({
    queryKey: adminKeys.mediaUsage(query),
    queryFn: () => getRealtimeUsage(query),
    placeholderData: keepPreviousData,
  })

const mediaImpactQueryOptions = (serverId: string | null) =>
  queryOptions({ queryKey: adminKeys.mediaImpact(serverId), queryFn: () => getMediaImpact(serverId), staleTime: 0 })

const serverMediaOverridesQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: adminKeys.serverMedia(serverId), queryFn: () => getServerMediaOverrides(serverId) })

const adminPublicRoadmapQueryOptions = queryOptions({
  queryKey: adminKeys.publicRoadmap(),
  queryFn: listAdminPublicRoadmap,
})

const adminPublicChangelogQueryOptions = queryOptions({
  queryKey: adminKeys.publicChangelog(),
  queryFn: listAdminPublicChangelog,
})

const adminPublicFeatureRequestsQueryOptions = queryOptions({
  queryKey: adminKeys.publicFeatureRequests(),
  queryFn: listAdminPublicFeatureRequests,
})

export {
  adminDevicesQueryOptions,
  adminMediaQueryOptions,
  adminServerDetailQueryOptions,
  adminServersQueryOptions,
  adminUserDevicesQueryOptions,
  adminUserSessionsQueryOptions,
  adminUsersQueryOptions,
  adminPublicChangelogQueryOptions,
  adminPublicFeatureRequestsQueryOptions,
  adminPublicRoadmapQueryOptions,
  hardwareSummaryQueryOptions,
  mediaImpactQueryOptions,
  mediaUsageQueryOptions,
  platformSettingsQueryOptions,
  registrationInvitesQueryOptions,
  serverMediaOverridesQueryOptions,
}

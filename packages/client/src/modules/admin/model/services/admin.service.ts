import {
  adminMediaResponseSchema,
  adminFeatureRequestSchema,
  adminServerDetailSchema,
  changelogEntrySchema,
  createChangelogEntrySchema,
  createRoadmapItemSchema,
  listAdminFeatureRequestsResponseSchema,
  listChangelogResponseSchema,
  listRoadmapResponseSchema,
  roadmapItemSchema,
  updateChangelogEntrySchema,
  updateRoadmapItemSchema,
  generateRegistrationInviteResponseSchema,
  hardwareSummarySchema,
  listAdminDevicesResponseSchema,
  listAdminServersResponseSchema,
  listAdminSessionsResponseSchema,
  listAdminUsersResponseSchema,
  listDevicesResponseSchema,
  listRegistrationInvitesResponseSchema,
  mediaChangeResponseSchema,
  mediaImpactSchema,
  realtimeUsagePeriodSchema,
  platformSettingsSchema,
  resetPasswordResponseSchema,
  sendAnnouncementResponseSchema,
  serverMediaOverridesSchema,
  type AdminListQuery,
  type AdminFeatureRequest,
  type AdminMediaResponse,
  type ChangelogEntry,
  type CreateChangelogEntry,
  type CreateRoadmapItem,
  type AdminServerDetail,
  type AdminSession,
  type DeviceReport,
  type GenerateRegistrationInviteResponse,
  type HardwareSummary,
  type ListAdminDevicesResponse,
  type ListAdminServersResponse,
  type ListAdminUsersResponse,
  type ListAdminFeatureRequestsResponse,
  type ListChangelogResponse,
  type ListRoadmapResponse,
  type MediaImpact,
  type RealtimeUsagePeriod,
  type RealtimeUsageQuery,
  type PlatformSettings,
  type RegistrationInvite,
  type RegistrationInviteValidity,
  type SendAnnouncementRequest,
  type ServerMediaOverrides,
  type UpdateMediaSettingsRequest,
  type UpdateServerMediaRequest,
  type UpdateSfuBudgetRequest,
  type ServerLimits,
  type UserLimits,
  type RoadmapItem,
  type UpdateChangelogEntry,
  type UpdateRoadmapItem,
} from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

async function listAdminUsers(query: AdminListQuery): Promise<ListAdminUsersResponse> {
  const { data } = await http.get('/admin/users', { params: query })
  return listAdminUsersResponseSchema.parse(data)
}

async function listAdminSessions(userId: string): Promise<AdminSession[]> {
  const { data } = await http.get(`/admin/users/${userId}/sessions`)
  return listAdminSessionsResponseSchema.parse(data).sessions
}

async function listAdminDevices(userId: string): Promise<DeviceReport[]> {
  const { data } = await http.get(`/admin/users/${userId}/devices`)
  return listDevicesResponseSchema.parse(data).devices
}

async function listAllAdminDevices(query: AdminListQuery): Promise<ListAdminDevicesResponse> {
  const { data } = await http.get('/admin/hardware/devices', { params: query })
  return listAdminDevicesResponseSchema.parse(data)
}

async function suspendUser(userId: string): Promise<void> {
  await http.post(`/admin/users/${userId}/suspend`)
}

async function reactivateUser(userId: string): Promise<void> {
  await http.post(`/admin/users/${userId}/reactivate`)
}

async function revokeUserSessions(userId: string): Promise<void> {
  await http.post(`/admin/users/${userId}/sessions/revoke`)
}

async function revokeUserSession(userId: string, sessionId: string): Promise<void> {
  await http.post(`/admin/users/${userId}/sessions/${sessionId}/revoke`)
}

/** The response repeats the password; it is the only time the API returns it. */
async function resetUserPassword(userId: string, password: string): Promise<string> {
  const { data } = await http.post(`/admin/users/${userId}/password`, { password })
  return resetPasswordResponseSchema.parse(data).password
}

async function setUserLimits(userId: string, limits: UserLimits): Promise<void> {
  await http.put(`/admin/users/${userId}/limits`, limits)
}

async function listAdminServers(query: AdminListQuery): Promise<ListAdminServersResponse> {
  const { data } = await http.get('/admin/servers', { params: query })
  return listAdminServersResponseSchema.parse(data)
}

async function getAdminServer(serverId: string): Promise<AdminServerDetail> {
  const { data } = await http.get(`/admin/servers/${serverId}`)
  return adminServerDetailSchema.parse(data)
}

async function deleteAdminServer(serverId: string): Promise<void> {
  await http.delete(`/admin/servers/${serverId}`)
}

async function setServerLimits(serverId: string, limits: ServerLimits): Promise<void> {
  await http.put(`/admin/servers/${serverId}/limits`, limits)
}

async function getHardwareSummary(): Promise<HardwareSummary> {
  const { data } = await http.get('/admin/hardware/summary')
  return hardwareSummarySchema.parse(data)
}

async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data } = await http.get('/admin/settings')
  return platformSettingsSchema.parse(data)
}

async function updatePlatformSettings(settings: PlatformSettings): Promise<PlatformSettings> {
  const { data } = await http.put('/admin/settings', settings)
  return platformSettingsSchema.parse(data)
}

async function listRegistrationInvites(): Promise<RegistrationInvite[]> {
  const { data } = await http.get('/admin/registration-invites')
  return listRegistrationInvitesResponseSchema.parse(data).invites
}

async function generateRegistrationInvite(
  validity: RegistrationInviteValidity,
): Promise<GenerateRegistrationInviteResponse> {
  const { data } = await http.post('/admin/registration-invites', { validity })
  return generateRegistrationInviteResponseSchema.parse(data)
}

async function revokeRegistrationInvite(inviteId: string): Promise<void> {
  await http.post(`/admin/registration-invites/${inviteId}/revoke`)
}

/** Platform announcement; answers how many people got it. */
async function sendAnnouncement(request: SendAnnouncementRequest): Promise<number> {
  const { data } = await http.post('/admin/announcements', request)
  return sendAnnouncementResponseSchema.parse(data).recipients
}

async function getAdminMedia(): Promise<AdminMediaResponse> {
  const { data } = await http.get('/admin/media')
  return adminMediaResponseSchema.parse(data)
}

/** How many people each resource would cut off now; null for the whole platform. */
async function getRealtimeUsage(query: RealtimeUsageQuery): Promise<RealtimeUsagePeriod> {
  const { data } = await http.get('/admin/media/usage', { params: query })
  return realtimeUsagePeriodSchema.parse(data)
}

async function getMediaImpact(serverId: string | null): Promise<MediaImpact> {
  const { data } = await http.get('/admin/media/impact', { params: serverId ? { serverId } : {} })
  return mediaImpactSchema.parse(data)
}

async function getServerMediaOverrides(serverId: string): Promise<ServerMediaOverrides> {
  const { data } = await http.get(`/admin/servers/${serverId}/media`)
  return serverMediaOverridesSchema.parse(data)
}

/** Answers how many people got the notice. */
async function updateMediaSettings(request: UpdateMediaSettingsRequest): Promise<number> {
  const { data } = await http.put('/admin/media', request)
  return mediaChangeResponseSchema.parse(data).notified
}

async function updateServerMedia(serverId: string, request: UpdateServerMediaRequest): Promise<number> {
  const { data } = await http.put(`/admin/servers/${serverId}/media`, request)
  return mediaChangeResponseSchema.parse(data).notified
}

async function updateSfuBudget(request: UpdateSfuBudgetRequest): Promise<void> {
  await http.put('/admin/media/budget', request)
}

async function listAdminPublicRoadmap(): Promise<ListRoadmapResponse> {
  const { data } = await http.get('/admin/public/roadmap')
  return listRoadmapResponseSchema.parse(data)
}

async function createAdminPublicRoadmap(input: CreateRoadmapItem): Promise<RoadmapItem> {
  const { data } = await http.post('/admin/public/roadmap', createRoadmapItemSchema.parse(input))
  return roadmapItemSchema.parse(data)
}

async function updateAdminPublicRoadmap(id: string, input: UpdateRoadmapItem): Promise<RoadmapItem> {
  const { data } = await http.patch(`/admin/public/roadmap/${id}`, updateRoadmapItemSchema.parse(input))
  return roadmapItemSchema.parse(data)
}

async function listAdminPublicChangelog(): Promise<ListChangelogResponse> {
  const { data } = await http.get('/admin/public/changelog')
  return listChangelogResponseSchema.parse(data)
}

async function createAdminPublicChangelog(input: CreateChangelogEntry): Promise<ChangelogEntry> {
  const { data } = await http.post('/admin/public/changelog', createChangelogEntrySchema.parse(input))
  return changelogEntrySchema.parse(data)
}

async function updateAdminPublicChangelog(id: string, input: UpdateChangelogEntry): Promise<ChangelogEntry> {
  const { data } = await http.patch(`/admin/public/changelog/${id}`, updateChangelogEntrySchema.parse(input))
  return changelogEntrySchema.parse(data)
}

async function listAdminPublicFeatureRequests(): Promise<ListAdminFeatureRequestsResponse> {
  const { data } = await http.get('/admin/public/feature-requests')
  return listAdminFeatureRequestsResponseSchema.parse(data)
}

async function moderateAdminPublicFeatureRequest(
  id: string,
  input: { status: AdminFeatureRequest['status']; roadmapItemId?: string | null },
): Promise<AdminFeatureRequest> {
  const { data } = await http.patch(`/admin/public/feature-requests/${id}`, input)
  return adminFeatureRequestSchema.parse(data)
}

export {
  deleteAdminServer,
  generateRegistrationInvite,
  getAdminMedia,
  getAdminServer,
  getHardwareSummary,
  getMediaImpact,
  getRealtimeUsage,
  getPlatformSettings,
  getServerMediaOverrides,
  listAdminDevices,
  listAdminServers,
  listAdminSessions,
  listAdminUsers,
  listAllAdminDevices,
  listRegistrationInvites,
  reactivateUser,
  resetUserPassword,
  revokeRegistrationInvite,
  revokeUserSession,
  revokeUserSessions,
  sendAnnouncement,
  setServerLimits,
  setUserLimits,
  suspendUser,
  updateMediaSettings,
  updatePlatformSettings,
  updateServerMedia,
  updateSfuBudget,
  createAdminPublicChangelog,
  createAdminPublicRoadmap,
  listAdminPublicChangelog,
  listAdminPublicFeatureRequests,
  listAdminPublicRoadmap,
  moderateAdminPublicFeatureRequest,
  updateAdminPublicChangelog,
  updateAdminPublicRoadmap,
}

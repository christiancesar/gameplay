import { z } from 'zod'
import { collectedHardwareSchema, manualHardwareSchema } from '../account/device-report.js'
import { passwordSchema } from '../account/password.js'
import { serverMemberSchema } from '../servers/membership.js'
import { roomSchema } from '../servers/server.js'

// Query of the paginated admin lists. search matches part of the name (and
// of the email, for users; of the username, for devices), ignoring case.
export const ADMIN_PAGE_SIZE_MAX = 100
export const adminListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(ADMIN_PAGE_SIZE_MAX).default(20),
})
export type AdminListQuery = z.input<typeof adminListQuerySchema>

const pageSchema = { total: z.number().int(), page: z.number().int(), pageSize: z.number().int() }

export const adminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  // "admin" is the platform admin.
  role: z.enum(['user', 'admin']),
  suspended: z.boolean(),
  twoFactorEnabled: z.boolean(),
  // At least one tab connected right now.
  online: z.boolean(),
  // Own limit of servers the user may own; null follows the platform default.
  maxServersOverride: z.number().int().nullable(),
  // The limit in force (override or default).
  effectiveMaxServers: z.number().int(),
  ownedServerCount: z.number().int(),
  // Active sessions (not expired).
  sessionCount: z.number().int(),
  createdAt: z.iso.datetime(),
})
export type AdminUser = z.infer<typeof adminUserSchema>

// Newest first.
export const listAdminUsersResponseSchema = z.object({ users: z.array(adminUserSchema), ...pageSchema })
export type ListAdminUsersResponse = z.infer<typeof listAdminUsersResponseSchema>

// IP and user agent as recorded by the sign-in.
export const adminSessionSchema = z.object({
  id: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.iso.datetime(),
  // Last time Better Auth refreshed the session.
  lastActiveAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
})
export type AdminSession = z.infer<typeof adminSessionSchema>

export const listAdminSessionsResponseSchema = z.object({ sessions: z.array(adminSessionSchema) })
export type ListAdminSessionsResponse = z.infer<typeof listAdminSessionsResponseSchema>

// Without a password, the API generates one. Either way the response shows
// it once, for the admin to pass on privately.
export const resetPasswordRequestSchema = z.object({ password: passwordSchema.optional() })
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>
export const resetPasswordResponseSchema = z.object({ password: z.string() })
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>

export const adminServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string().nullable(),
  owner: z.object({ id: z.string(), username: z.string() }),
  memberCount: z.number().int(),
  roomCount: z.number().int(),
  // Own limits of the server; null follows the platform default.
  maxMembersOverride: z.number().int().nullable(),
  maxRoomsOverride: z.number().int().nullable(),
  // The limits in force (override or default).
  effectiveMaxMembers: z.number().int(),
  effectiveMaxRooms: z.number().int(),
  createdAt: z.iso.datetime(),
})
export type AdminServer = z.infer<typeof adminServerSchema>

// Newest first.
export const listAdminServersResponseSchema = z.object({ servers: z.array(adminServerSchema), ...pageSchema })
export type ListAdminServersResponse = z.infer<typeof listAdminServersResponseSchema>

// Members come with the invite each one used and who created it.
export const adminServerDetailSchema = adminServerSchema.extend({
  rooms: z.array(roomSchema),
  members: z.array(serverMemberSchema),
})
export type AdminServerDetail = z.infer<typeof adminServerDetailSchema>

// Over every device report. Each figure counts only the devices that
// reported it; null when none did.
export const hardwareSummarySchema = z.object({
  devices: z.number().int(),
  minLogicalCores: z.number().int().nullable(),
  minDeviceMemoryGb: z.number().nullable(),
  hardwareAccelerationPercent: z.number().nullable(),
  h264HardwarePercent: z.number().nullable(),
})
export type HardwareSummary = z.infer<typeof hardwareSummarySchema>

// One report of one device, with who sent it. Newest first.
export const adminDeviceSchema = z.object({
  user: z.object({ id: z.string(), username: z.string() }),
  deviceId: z.string(),
  collected: collectedHardwareSchema,
  manual: manualHardwareSchema.nullable(),
  collectedAt: z.iso.datetime(),
})
export type AdminDevice = z.infer<typeof adminDeviceSchema>

export const listAdminDevicesResponseSchema = z.object({ devices: z.array(adminDeviceSchema), ...pageSchema })
export type ListAdminDevicesResponse = z.infer<typeof listAdminDevicesResponseSchema>

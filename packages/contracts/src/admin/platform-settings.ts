import { z } from 'zod'

const limit = z.number().int().min(1)

// Global defaults, editable by the platform admin without a redeploy.
export const platformSettingsSchema = z.object({
  maxServersPerUser: limit,
  maxMembersPerServer: limit,
  maxRoomsPerServer: limit,
})
export type PlatformSettings = z.infer<typeof platformSettingsSchema>

// null goes back to the global default; 0 blocks the resource for that user.
export const userLimitsSchema = z.object({
  maxServers: z.number().int().min(0).nullable(),
})
export type UserLimits = z.infer<typeof userLimitsSchema>

// Per-server override, same rules as the user one.
export const serverLimitsSchema = z.object({
  maxMembers: z.number().int().min(0).nullable(),
  maxRooms: z.number().int().min(0).nullable(),
})
export type ServerLimits = z.infer<typeof serverLimitsSchema>

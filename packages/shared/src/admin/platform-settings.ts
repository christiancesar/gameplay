import { z } from 'zod'

const limit = z.number().int().min(1)

// Global defaults, editable by the platform admin without a redeploy.
export const platformSettingsSchema = z.object({
  maxServersPerUser: limit,
  maxMembersPerServer: limit,
  maxRoomsPerServer: limit,
  // Below it the web shows the outdated-browser alert.
  minChromiumVersion: z.number().int().min(1),
})
export type PlatformSettings = z.infer<typeof platformSettingsSchema>

// Served without a session, for the browser alert on the sign-in page.
export const publicSettingsSchema = platformSettingsSchema.pick({ minChromiumVersion: true })
export type PublicSettings = z.infer<typeof publicSettingsSchema>

// null goes back to the global default; 0 blocks the resource for that user.
export const userLimitsSchema = z.object({
  maxServers: z.number().int().min(0).nullable(),
})
export type UserLimits = z.infer<typeof userLimitsSchema>

import { z } from 'zod'

// How many servers the user may own and how many they own now.
export const myLimitsSchema = z.object({
  maxServers: z.number().int(),
  ownedServers: z.number().int(),
})
export type MyLimits = z.infer<typeof myLimitsSchema>

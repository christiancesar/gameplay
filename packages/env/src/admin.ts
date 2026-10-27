import { passwordSchema, usernameSchema } from '@gameplay/contracts'
import { z } from 'zod'

/** The platform admin the seed script creates (apps/api/src/scripts/seed-admin.ts). */
export const adminEnvObject = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_USERNAME: usernameSchema,
  ADMIN_PASSWORD: passwordSchema,
})

export type AdminEnv = z.infer<typeof adminEnvObject>

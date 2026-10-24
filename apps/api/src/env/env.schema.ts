import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Better Auth: signs cookies and tokens; at least 32 characters.
  BETTER_AUTH_SECRET: z.string().min(32),
  // Public URL of the API (cookies and auth links are built from it).
  BETTER_AUTH_URL: z.url(),
  // Web app origin, trusted by the auth routes.
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  // API docs (/api/docs). Unset: on outside production.
  DOCS_ENABLED: z.stringbool().optional(),
})

export type Env = z.infer<typeof envSchema>

// Used by ConfigModule: fails the startup with every invalid variable listed.
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config)
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

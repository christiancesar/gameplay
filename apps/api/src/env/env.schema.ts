import { z } from 'zod'

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    // Better Auth: signs cookies and tokens; at least 32 characters.
    BETTER_AUTH_SECRET: z.string().min(32),
    // Public URL of the API (cookies and auth links are built from it).
    BETTER_AUTH_URL: z.url(),
    // Signs the registration keys (HMAC); at least 32 characters. Changing it
    // invalidates every unused key.
    REGISTRATION_KEY_SECRET: z.string().min(32),
    // Web app origin, trusted by the auth routes.
    WEB_ORIGIN: z.url().default('http://localhost:5173'),
    // API docs (/api/docs). Unset: on outside production.
    DOCS_ENABLED: z.stringbool().optional(),
    // Where uploaded images go: a local directory (served by nginx, or by the
    // API outside production) or an S3-compatible bucket.
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('./uploads'),
    // Base of the public image URLs: "/uploads" for local, the bucket or CDN URL for s3.
    PUBLIC_UPLOADS_URL: z.string().default('/uploads'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().default('auto'),
    // Only for non-AWS providers (R2, an S3 mock).
    S3_ENDPOINT: z.url().optional(),
    S3_FORCE_PATH_STYLE: z.stringbool().default(false),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER !== 's3') return
    for (const key of ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const) {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'Required when STORAGE_DRIVER is s3' })
    }
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

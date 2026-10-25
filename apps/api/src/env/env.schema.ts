import { z } from 'zod'

// Comma-separated list, e.g. "turn:a:3478?transport=udp,turn:a:3478?transport=tcp".
const urlList = z.string().transform((value) =>
  value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
)

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
    // Proxies in front of the API whose X-Forwarded-For is trusted (Express
    // "trust proxy" hops): 1 behind nginx or cloudflared, 0 when exposed directly.
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
    // ICE servers for WebRTC: Cloudflare Realtime TURN (local phase), coturn
    // (EC2 phase) or STUN only.
    ICE_PROVIDER: z.enum(['cloudflare', 'coturn', 'stun-only']).default('stun-only'),
    // Used by stun-only and by coturn (next to its TURN URLs).
    STUN_URLS: urlList.default(['stun:stun.cloudflare.com:3478']),
    // How long issued TURN credentials last. Longer than a voice session.
    ICE_TTL_SECONDS: z.coerce.number().int().min(60).max(172_800).default(86_400),
    CLOUDFLARE_TURN_KEY_ID: z.string().optional(),
    CLOUDFLARE_TURN_API_TOKEN: z.string().optional(),
    COTURN_URLS: urlList.optional(),
    // static-auth-secret of coturn's REST API (use-auth-secret).
    COTURN_SECRET: z.string().min(16).optional(),
    // How long a voice seat waits for its socket to reconnect before the
    // person leaves the room.
    ROOM_RECONNECT_GRACE_MS: z.coerce.number().int().min(0).default(30_000),
  })
  .superRefine((env, ctx) => {
    const required = (keys: readonly (keyof typeof env)[], when: string) => {
      for (const key of keys) {
        if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: `Required when ${when}` })
      }
    }
    if (env.STORAGE_DRIVER === 's3') {
      required(['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'], 'STORAGE_DRIVER is s3')
    }
    if (env.ICE_PROVIDER === 'cloudflare') {
      required(['CLOUDFLARE_TURN_KEY_ID', 'CLOUDFLARE_TURN_API_TOKEN'], 'ICE_PROVIDER is cloudflare')
    }
    if (env.ICE_PROVIDER === 'coturn') required(['COTURN_URLS', 'COTURN_SECRET'], 'ICE_PROVIDER is coturn')
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

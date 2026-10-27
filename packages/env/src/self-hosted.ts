import { z } from 'zod'
import { adminEnvObject } from './admin.js'
import { apiEnvObject } from './api.js'
import { cloudflareTurnRule, requireKeys } from './rules.js'

export const TUNNEL_MODES = ['quick', 'named', 'token'] as const
export type TunnelMode = (typeof TUNNEL_MODES)[number]

const port = (fallback: number) => z.coerce.number().int().min(1).max(65_535).default(fallback)

/**
 * infra/self-hosted/.env. The compose file builds the rest of the API
 * variables (DATABASE_URL, BETTER_AUTH_URL, storage) from these.
 * Empty values count as unset, as in docker compose's `${VAR:-default}`.
 */
export const selfHostedEnvObject = apiEnvObject
  .pick({
    LOG_LEVEL: true,
    DOCS_ENABLED: true,
    BETTER_AUTH_SECRET: true,
    REGISTRATION_KEY_SECRET: true,
    CLOUDFLARE_TURN_KEY_ID: true,
    CLOUDFLARE_TURN_API_TOKEN: true,
    CLOUDFLARE_SFU_APP_ID: true,
    CLOUDFLARE_SFU_APP_TOKEN: true,
    CLOUDFLARE_ACCOUNT_ID: true,
    CLOUDFLARE_ANALYTICS_TOKEN: true,
  })
  .extend(adminEnvObject.shape)
  .extend({
    // As in production: Realtime TURN relays the calls behind CGNAT.
    ICE_PROVIDER: apiEnvObject.shape.ICE_PROVIDER.unwrap().default('cloudflare'),
    TUNNEL_MODE: z.enum(TUNNEL_MODES).default('quick'),
    // Public https URL. Quick mode: written by the CLI from the tunnel.
    APP_URL: z.url({ protocol: /^https?$/ }).optional(),
    CLOUDFLARE_TUNNEL_ID: z.string().optional(),
    CLOUDFLARE_TUNNEL_CREDENTIALS: z.string().optional(),
    CLOUDFLARE_TUNNEL_TOKEN: z.string().optional(),
    // Derived by the CLI in named mode.
    PUBLIC_HOSTNAME: z.string().optional(),
    CLOUDFLARED_UID: z.coerce.number().int().min(0).optional(),
    WEB_PORT: port(8080),
    CLOUDFLARED_METRICS_PORT: port(20241),
    POSTGRES_HOST_PORT: port(5433),
    POSTGRES_PASSWORD: z.string().min(16),
    OTEL_DEPLOYMENT_ENVIRONMENT: z.string().optional(),
    OTEL_SERVICE_NAME: z.string().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
    OTEL_EXPORTER_OTLP_PROTOCOL: z.string().optional(),
    OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
    VITE_SENTRY_DSN: z.url().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    SENTRY_PROJECT_ID: z.string().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    FARO_COLLECTOR_URL: z.url().optional(),
  })

export const selfHostedEnvSchema = selfHostedEnvObject.superRefine((env, ctx) => {
  cloudflareTurnRule(env, ctx)
  if (env.TUNNEL_MODE === 'named') {
    requireKeys(env, ctx, ['APP_URL', 'CLOUDFLARE_TUNNEL_ID', 'CLOUDFLARE_TUNNEL_CREDENTIALS'], 'TUNNEL_MODE is named')
  }
  if (env.TUNNEL_MODE === 'token') {
    requireKeys(env, ctx, ['APP_URL', 'CLOUDFLARE_TUNNEL_TOKEN'], 'TUNNEL_MODE is token')
  }
})

export type SelfHostedEnv = z.infer<typeof selfHostedEnvSchema>
export type SelfHostedEnvKey = keyof z.input<typeof selfHostedEnvSchema>

import { randomBytes } from 'node:crypto'
import type { SelfHostedEnvKey } from '@gameplay/env'

/** Where a variable of the self-hosted .env comes from. */
export type EnvSource =
  /** A random secret the CLI creates when it is empty. */
  | { kind: 'generated'; generate: () => string }
  /** The .env.example value or the schema default is enough. */
  | { kind: 'default' }
  /** Filled by the CLI from another value while starting. */
  | { kind: 'derived'; from: string }
  /** Only the person running the stack has it: where to get it. */
  | { kind: 'external'; hint: string }

const secret = (bytes: number): EnvSource => ({
  kind: 'generated',
  generate: () => randomBytes(bytes).toString('hex'),
})
const fallback: EnvSource = { kind: 'default' }
const external = (hint: string): EnvSource => ({ kind: 'external', hint })

const CLOUDFLARE_TURN = 'Cloudflare dashboard > Realtime > TURN Server'
const CLOUDFLARE_SFU = 'Cloudflare dashboard > Realtime > Serverless SFU'
const CLOUDFLARE_ANALYTICS = 'Cloudflare account id, and an API token with Account Analytics: Read'
const NAMED_TUNNEL = 'cloudflared tunnel create (see infra/self-hosted/README.md)'
const TOKEN_TUNNEL = 'Cloudflare Zero Trust > Networks > Tunnels'
const SENTRY = 'Sentry project settings'
const GRAFANA = 'Grafana Cloud > OpenTelemetry'

/** Typed by the schema: a new variable fails the typecheck until it is listed here. */
export const ENV_SOURCES: Record<SelfHostedEnvKey, EnvSource> = {
  POSTGRES_PASSWORD: secret(24),
  BETTER_AUTH_SECRET: secret(32),
  REGISTRATION_KEY_SECRET: secret(32),
  ADMIN_PASSWORD: secret(12),

  TUNNEL_MODE: fallback,
  WEB_PORT: fallback,
  CLOUDFLARED_METRICS_PORT: fallback,
  POSTGRES_HOST_PORT: fallback,
  ICE_PROVIDER: fallback,
  LOG_LEVEL: fallback,
  DOCS_ENABLED: fallback,
  ADMIN_EMAIL: fallback,
  ADMIN_USERNAME: fallback,
  OTEL_DEPLOYMENT_ENVIRONMENT: fallback,
  OTEL_SERVICE_NAME: fallback,
  OTEL_EXPORTER_OTLP_PROTOCOL: fallback,

  PUBLIC_HOSTNAME: { kind: 'derived', from: 'APP_URL (named mode)' },
  CLOUDFLARED_UID: { kind: 'derived', from: 'your user id (named mode)' },

  // Derived from the tunnel in quick mode; your hostname in named and token modes.
  APP_URL: external('your tunnel hostname, https://...'),
  CLOUDFLARE_TUNNEL_ID: external(NAMED_TUNNEL),
  CLOUDFLARE_TUNNEL_CREDENTIALS: external(`${NAMED_TUNNEL}: path of the credentials JSON`),
  CLOUDFLARE_TUNNEL_TOKEN: external(TOKEN_TUNNEL),
  CLOUDFLARE_TURN_KEY_ID: external(CLOUDFLARE_TURN),
  CLOUDFLARE_TURN_API_TOKEN: external(CLOUDFLARE_TURN),
  CLOUDFLARE_SFU_APP_ID: external(CLOUDFLARE_SFU),
  CLOUDFLARE_SFU_APP_TOKEN: external(CLOUDFLARE_SFU),
  CLOUDFLARE_ACCOUNT_ID: external(CLOUDFLARE_ANALYTICS),
  CLOUDFLARE_ANALYTICS_TOKEN: external(CLOUDFLARE_ANALYTICS),
  VITE_SENTRY_DSN: external(SENTRY),
  SENTRY_ORG: external(SENTRY),
  SENTRY_PROJECT: external(SENTRY),
  SENTRY_PROJECT_ID: external(SENTRY),
  SENTRY_AUTH_TOKEN: external('Sentry > Settings > Auth Tokens'),
  OTEL_EXPORTER_OTLP_ENDPOINT: external(GRAFANA),
  OTEL_EXPORTER_OTLP_HEADERS: external(GRAFANA),
  FARO_COLLECTOR_URL: external('Grafana Cloud > Frontend Observability'),
}

/** The where-to-get-it hint of a variable, when it comes from outside. */
export function hintFor(key: string): string | null {
  const source = (ENV_SOURCES as Record<string, EnvSource | undefined>)[key]
  return source?.kind === 'external' ? source.hint : null
}

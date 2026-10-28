import type { SelfHostedEnvKey } from '@gameplay/env'

/**
 * The env files of the stack. `host` is what the machine runs (tunnel, ports, database) and what more than one
 * service reads; `api` is the api container; `web` is the web image (build arguments and the nginx tunnels).
 */
export type EnvTarget = 'host' | 'api' | 'web'

export const ENV_TARGETS: readonly EnvTarget[] = ['host', 'api', 'web']

const HOST = 'host'
const API = 'api'
const WEB = 'web'

/** Typed by the schema: a new variable fails the typecheck until it is placed in a file. */
export const ENV_LAYOUT: Record<SelfHostedEnvKey, EnvTarget> = {
  TUNNEL_MODE: HOST,
  APP_URL: HOST,
  CLOUDFLARE_TUNNEL_ID: HOST,
  CLOUDFLARE_TUNNEL_CREDENTIALS: HOST,
  CLOUDFLARE_TUNNEL_TOKEN: HOST,
  PUBLIC_HOSTNAME: HOST,
  CLOUDFLARED_UID: HOST,
  WEB_PORT: HOST,
  CLOUDFLARED_METRICS_PORT: HOST,
  POSTGRES_HOST_PORT: HOST,
  // The api and the database both read it.
  POSTGRES_PASSWORD: HOST,
  // Names this server in Grafana and in the Sentry environment of the web build.
  OTEL_DEPLOYMENT_ENVIRONMENT: HOST,

  LOG_LEVEL: API,
  DOCS_ENABLED: API,
  BETTER_AUTH_SECRET: API,
  REGISTRATION_KEY_SECRET: API,
  ADMIN_EMAIL: API,
  ADMIN_USERNAME: API,
  ADMIN_PASSWORD: API,
  ICE_PROVIDER: API,
  CLOUDFLARE_TURN_KEY_ID: API,
  CLOUDFLARE_TURN_API_TOKEN: API,
  CLOUDFLARE_SFU_APP_ID: API,
  CLOUDFLARE_SFU_APP_TOKEN: API,
  CLOUDFLARE_ACCOUNT_ID: API,
  CLOUDFLARE_ANALYTICS_TOKEN: API,
  OTEL_SERVICE_NAME: API,
  OTEL_EXPORTER_OTLP_ENDPOINT: API,
  OTEL_EXPORTER_OTLP_PROTOCOL: API,
  OTEL_EXPORTER_OTLP_HEADERS: API,

  VITE_SENTRY_DSN: WEB,
  SENTRY_ORG: WEB,
  SENTRY_PROJECT: WEB,
  SENTRY_PROJECT_ID: WEB,
  SENTRY_AUTH_TOKEN: WEB,
  FARO_COLLECTOR_URL: WEB,
}

/** The file a variable lives in; anything the schema does not know stays in the host file. */
export function targetOf(key: string): EnvTarget {
  return (ENV_LAYOUT as Record<string, EnvTarget | undefined>)[key] ?? 'host'
}

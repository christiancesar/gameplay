// Env file contents the specs start from.

export const ENV_WITH_COMMENTS = `# Tunnel
TUNNEL_MODE=quick
APP_URL=

# Database
POSTGRES_PASSWORD=secret=with=equals
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic abc"
`

/** An .env from before APP_URL replaced PUBLIC_URL. */
export const ENV_WITH_OLD_NAMES = `TUNNEL_MODE=named
PUBLIC_URL=https://gameplay.example.com
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
`

/** The one .env from before the split: host, api and web variables together. */
export const ENV_BEFORE_THE_SPLIT = `TUNNEL_MODE=named
APP_URL=https://gameplay.example.com
POSTGRES_PASSWORD=kept-database-password
BETTER_AUTH_SECRET=kept-auth-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=kept-admin-password
VITE_SENTRY_DSN=https://key@o1.ingest.sentry.io/2
SENTRY_AUTH_TOKEN=kept-token
OTEL_DEPLOYMENT_ENVIRONMENT=host
SOMETHING_ELSE=stays
`

/** The Cloudflare TURN key, required by the default ICE_PROVIDER. */
export const TURN_KEY = {
  CLOUDFLARE_TURN_KEY_ID: 'turn-key',
  CLOUDFLARE_TURN_API_TOKEN: 'turn-token',
}

/** The fresh examples, one per file: secrets and the admin password still empty. */
export const HOST_EXAMPLE = `TUNNEL_MODE=quick
APP_URL=
POSTGRES_PASSWORD=
`
export const API_EXAMPLE = `BETTER_AUTH_SECRET=
REGISTRATION_KEY_SECRET=
ADMIN_EMAIL=admin@gameplay.local
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
`
export const WEB_EXAMPLE = `VITE_SENTRY_DSN=
`

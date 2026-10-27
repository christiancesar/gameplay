// .env contents the specs start from.

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

/** The Cloudflare TURN key, required by the default ICE_PROVIDER. */
export const TURN_KEY = `CLOUDFLARE_TURN_KEY_ID=turn-key
CLOUDFLARE_TURN_API_TOKEN=turn-token
`

/** The fresh example: secrets and the admin password still empty. */
export const ENV_EXAMPLE = `TUNNEL_MODE=quick
APP_URL=
POSTGRES_PASSWORD=
BETTER_AUTH_SECRET=
REGISTRATION_KEY_SECRET=
ADMIN_EMAIL=admin@gameplay.local
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
`

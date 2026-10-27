// .env contents the specs start from.

export const ENV_WITH_COMMENTS = `# Tunnel
TUNNEL_MODE=quick
APP_URL=

# Database
POSTGRES_PASSWORD=secret=with=equals
`

/** An .env from before APP_URL replaced PUBLIC_URL. */
export const ENV_WITH_OLD_NAMES = `TUNNEL_MODE=named
PUBLIC_URL=https://gameplay.example.com
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
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

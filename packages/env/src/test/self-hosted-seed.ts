// A self-hosted .env as the CLI leaves it on the first quick-mode start.
export const QUICK_MODE_ENV = {
  TUNNEL_MODE: 'quick',
  POSTGRES_PASSWORD: 'p'.repeat(48),
  BETTER_AUTH_SECRET: 'a'.repeat(64),
  REGISTRATION_KEY_SECRET: 'r'.repeat(64),
  ADMIN_EMAIL: 'admin@gameplay.local',
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'x'.repeat(24),
  CLOUDFLARE_TURN_KEY_ID: 'turn-key',
  CLOUDFLARE_TURN_API_TOKEN: 'turn-token',
}

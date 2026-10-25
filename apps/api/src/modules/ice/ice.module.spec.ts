import type { EnvService } from '../../env/env.service'
import { type Env, validateEnv } from '../../env/env.schema'
import { createIceProvider } from './ice.module'
import { CloudflareIceProvider } from './providers/cloudflare.ice-provider'
import { CoturnIceProvider } from './providers/coturn.ice-provider'
import { StunOnlyIceProvider } from './providers/stun-only.ice-provider'

function envWith(overrides: Record<string, string>): EnvService {
  const env = validateEnv({
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    BETTER_AUTH_SECRET: 'a'.repeat(32),
    REGISTRATION_KEY_SECRET: 'b'.repeat(32),
    BETTER_AUTH_URL: 'http://localhost:3333',
    ...overrides,
  })
  return { get: <K extends keyof Env>(key: K) => env[key] } as EnvService
}

describe('createIceProvider', () => {
  const stunOnly = new StunOnlyIceProvider(['stun:s:3478'])

  it.each([
    ['stun-only', {}, StunOnlyIceProvider],
    ['cloudflare', { CLOUDFLARE_TURN_KEY_ID: 'k', CLOUDFLARE_TURN_API_TOKEN: 't' }, CloudflareIceProvider],
    ['coturn', { COTURN_URLS: 'turn:a:3478', COTURN_SECRET: 's'.repeat(16) }, CoturnIceProvider],
  ])('picks %s from ICE_PROVIDER', (provider, extra, type) => {
    expect(createIceProvider(envWith({ ICE_PROVIDER: provider, ...extra }), stunOnly)).toBeInstanceOf(type)
  })
})

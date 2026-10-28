import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { prepareEnv, validateEnv } from './setup-env.ts'
import { HostError } from './shell.ts'
import { envFixture } from './test/env-fixture.ts'
import { ENV_BEFORE_THE_SPLIT, ENV_WITH_OLD_NAMES, TURN_KEY } from './test/env-seed.ts'
import { useTemporaryDir } from './test/temporary-dir.ts'

describe('prepareEnv', () => {
  const temporary = useTemporaryDir()

  it('creates the three files from the examples with random secrets in the file that owns each', () => {
    const { paths, examples } = envFixture(temporary)

    const { env, generatedAdminPassword } = prepareEnv(paths, examples)

    expect([paths.host, paths.api, paths.web].every((path) => existsSync(path))).toBe(true)
    expect(env.files.host.get('POSTGRES_PASSWORD')).toMatch(/^[0-9a-f]{48}$/)
    expect(env.files.api.get('BETTER_AUTH_SECRET')).toMatch(/^[0-9a-f]{64}$/)
    expect(env.files.api.get('REGISTRATION_KEY_SECRET')).toMatch(/^[0-9a-f]{64}$/)
    expect(generatedAdminPassword).toMatch(/^[0-9a-f]{24}$/)
    expect(env.get('ADMIN_PASSWORD')).toBe(generatedAdminPassword)
  })

  it('keeps what is already filled', () => {
    const { paths, examples } = envFixture(temporary)
    const first = prepareEnv(paths, examples).env.get('POSTGRES_PASSWORD')

    const { env, generatedAdminPassword } = prepareEnv(paths, examples)

    expect(env.get('POSTGRES_PASSWORD')).toBe(first)
    expect(generatedAdminPassword).toBeNull()
  })

  it('renames the keys of an older .env', () => {
    const { paths, examples } = envFixture(temporary, { host: ENV_WITH_OLD_NAMES })

    const { env } = prepareEnv(paths, examples)

    expect(env.has('PUBLIC_URL')).toBe(false)
    expect(env.get('APP_URL')).toBe('https://gameplay.example.com')
  })

  it('moves the api and web variables out of an .env from before the split, keeping every value', () => {
    const { paths, examples } = envFixture(temporary, { host: ENV_BEFORE_THE_SPLIT })

    const { env, generatedAdminPassword } = prepareEnv(paths, examples)

    expect(env.files.host.values()).toMatchObject({
      TUNNEL_MODE: 'named',
      APP_URL: 'https://gameplay.example.com',
      POSTGRES_PASSWORD: 'kept-database-password',
      OTEL_DEPLOYMENT_ENVIRONMENT: 'host',
      SOMETHING_ELSE: 'stays',
    })
    expect(env.files.host.has('BETTER_AUTH_SECRET')).toBe(false)
    expect(env.files.host.has('VITE_SENTRY_DSN')).toBe(false)
    expect(env.files.api.get('BETTER_AUTH_SECRET')).toBe('kept-auth-secret')
    expect(env.files.api.get('ADMIN_PASSWORD')).toBe('kept-admin-password')
    expect(env.files.web.get('VITE_SENTRY_DSN')).toBe('https://key@o1.ingest.sentry.io/2')
    expect(env.files.web.get('SENTRY_AUTH_TOKEN')).toBe('kept-token')
    // The admin password was there already: nothing to show.
    expect(generatedAdminPassword).toBeNull()
    expect(readFileSync(paths.host, 'utf8')).not.toContain('kept-auth-secret')
  })
})

describe('validateEnv', () => {
  const temporary = useTemporaryDir()

  function prepared() {
    const { paths, examples } = envFixture(temporary)
    return prepareEnv(paths, examples).env
  }

  it('returns the values of the three files typed, with the defaults', () => {
    const env = prepared()
    for (const [key, value] of Object.entries(TURN_KEY)) env.set(key, value)

    expect(validateEnv(env)).toMatchObject({ TUNNEL_MODE: 'quick', ICE_PROVIDER: 'cloudflare', WEB_PORT: 8080 })
  })

  it('lists what is missing with the file to fix and where to get it', () => {
    const env = prepared()

    expect(() => validateEnv(env)).toThrow(HostError)
    expect(() => validateEnv(env)).toThrow(
      /CLOUDFLARE_TURN_KEY_ID \(\.env\.api\): Required when ICE_PROVIDER is cloudflare \(Cloudflare dashboard > Realtime > TURN Server\)/,
    )
  })

  it('treats empty values as unset', () => {
    const env = prepared()
    for (const [key, value] of Object.entries(TURN_KEY)) env.set(key, value)
    env.set('WEB_PORT', '')

    expect(validateEnv(env).WEB_PORT).toBe(8080)
  })
})

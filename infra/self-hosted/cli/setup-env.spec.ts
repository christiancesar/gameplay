import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EnvFile } from './env-file.ts'
import { prepareEnv, validateEnv } from './setup-env.ts'
import { HostError } from './shell.ts'
import { ENV_EXAMPLE, ENV_WITH_OLD_NAMES, TURN_KEY } from './test/env-seed.ts'
import { useTemporaryDir } from './test/temporary-dir.ts'

describe('prepareEnv', () => {
  const temporary = useTemporaryDir()

  it('creates the .env from the example with random secrets', () => {
    const example = temporary.file('.env.example', ENV_EXAMPLE)
    const envPath = temporary.path('.env')

    const { env, generatedAdminPassword } = prepareEnv(envPath, example)

    expect(existsSync(envPath)).toBe(true)
    expect(env.get('POSTGRES_PASSWORD')).toMatch(/^[0-9a-f]{48}$/)
    expect(env.get('BETTER_AUTH_SECRET')).toMatch(/^[0-9a-f]{64}$/)
    expect(env.get('REGISTRATION_KEY_SECRET')).toMatch(/^[0-9a-f]{64}$/)
    expect(generatedAdminPassword).toMatch(/^[0-9a-f]{24}$/)
    expect(env.get('ADMIN_PASSWORD')).toBe(generatedAdminPassword)
  })

  it('keeps what is already filled', () => {
    const example = temporary.file('.env.example', ENV_EXAMPLE)
    const envPath = temporary.path('.env')
    const first = prepareEnv(envPath, example).env.get('POSTGRES_PASSWORD')

    const { env, generatedAdminPassword } = prepareEnv(envPath, example)

    expect(env.get('POSTGRES_PASSWORD')).toBe(first)
    expect(generatedAdminPassword).toBeNull()
  })

  it('renames the keys of an older .env', () => {
    const envPath = temporary.file('.env', ENV_WITH_OLD_NAMES)

    const { env } = prepareEnv(envPath, envPath)

    expect(env.has('PUBLIC_URL')).toBe(false)
    expect(env.get('APP_URL')).toBe('https://gameplay.example.com')
  })
})

describe('validateEnv', () => {
  const temporary = useTemporaryDir()

  it('returns the values typed, with the defaults', () => {
    const env = new EnvFile(temporary.file('.env', `${ENV_EXAMPLE}${TURN_KEY}`))
    prepareEnv(env.path, env.path)

    expect(validateEnv(env)).toMatchObject({ TUNNEL_MODE: 'quick', ICE_PROVIDER: 'cloudflare', WEB_PORT: 8080 })
  })

  it('lists what is missing with where to get it', () => {
    const env = new EnvFile(temporary.file('.env', ENV_EXAMPLE))
    prepareEnv(env.path, env.path)

    expect(() => validateEnv(env)).toThrow(HostError)
    expect(() => validateEnv(env)).toThrow(
      /CLOUDFLARE_TURN_KEY_ID: Required when ICE_PROVIDER is cloudflare \(Cloudflare dashboard > Realtime > TURN Server\)/,
    )
  })

  it('treats empty values as unset', () => {
    const env = new EnvFile(temporary.file('.env', `${ENV_EXAMPLE}${TURN_KEY}WEB_PORT=\n`))
    prepareEnv(env.path, env.path)

    expect(validateEnv(env).WEB_PORT).toBe(8080)
  })
})

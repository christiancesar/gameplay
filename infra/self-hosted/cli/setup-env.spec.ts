import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { prepareEnv } from './setup-env.ts'
import { HostError } from './shell.ts'
import { ENV_EXAMPLE, ENV_WITH_OLD_NAMES } from './test/env-seed.ts'
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
    expect(env.get('POSTGRES_HOST_PORT')).toBe('5433')
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

  it('refuses an .env without the admin email', () => {
    const envPath = temporary.file('.env', ENV_EXAMPLE.replace('ADMIN_EMAIL=admin@gameplay.local', 'ADMIN_EMAIL='))

    expect(() => prepareEnv(envPath, envPath)).toThrow(HostError)
  })
})

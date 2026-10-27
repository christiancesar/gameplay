import { readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EnvFile } from './env-file.ts'
import { ENV_WITH_COMMENTS, ENV_WITH_OLD_NAMES } from './test/env-seed.ts'
import { useTemporaryDir } from './test/temporary-dir.ts'

describe('EnvFile', () => {
  const temporary = useTemporaryDir()

  it('reads raw values, empty for missing keys', () => {
    const env = new EnvFile(temporary.file('.env', ENV_WITH_COMMENTS))

    expect(env.get('TUNNEL_MODE')).toBe('quick')
    expect(env.get('POSTGRES_PASSWORD')).toBe('secret=with=equals')
    expect(env.get('APP_URL')).toBe('')
    expect(env.get('OTEL_EXPORTER_OTLP_HEADERS')).toBe('Authorization=Basic abc')
    expect(env.get('MISSING')).toBe('')
    expect(env.has('APP_URL')).toBe(true)
    expect(env.has('MISSING')).toBe(false)
  })

  it('lists every value, the last line winning', () => {
    const env = new EnvFile(temporary.file('.env', `${ENV_WITH_COMMENTS}TUNNEL_MODE=named\n`))

    expect(env.values()).toEqual({
      TUNNEL_MODE: 'named',
      APP_URL: '',
      POSTGRES_PASSWORD: 'secret=with=equals',
      OTEL_EXPORTER_OTLP_HEADERS: 'Authorization=Basic abc',
    })
  })

  it('replaces a key in place and keeps comments', () => {
    const path = temporary.file('.env', ENV_WITH_COMMENTS)

    new EnvFile(path).set('APP_URL', 'https://a.trycloudflare.com')

    expect(readFileSync(path, 'utf8')).toBe(
      ENV_WITH_COMMENTS.replace('APP_URL=', 'APP_URL=https://a.trycloudflare.com'),
    )
  })

  it('appends a missing key and keeps the file private', () => {
    const path = temporary.file('.env', ENV_WITH_COMMENTS)

    new EnvFile(path).set('WEB_PORT', '8080')

    expect(readFileSync(path, 'utf8')).toBe(`${ENV_WITH_COMMENTS}WEB_PORT=8080\n`)
    expect(statSync(path).mode & 0o777).toBe(0o600)
  })

  it('renames a key and keeps its value', () => {
    const env = new EnvFile(temporary.file('.env', ENV_WITH_OLD_NAMES))

    env.rename('PUBLIC_URL', 'APP_URL')

    expect(env.has('PUBLIC_URL')).toBe(false)
    expect(env.get('APP_URL')).toBe('https://gameplay.example.com')
  })

  it('keeps the new key when it already has a value', () => {
    const env = new EnvFile(temporary.file('.env', `${ENV_WITH_OLD_NAMES}APP_URL=https://new.example.com\n`))

    env.rename('PUBLIC_URL', 'APP_URL')

    expect(env.has('PUBLIC_URL')).toBe(false)
    expect(env.get('APP_URL')).toBe('https://new.example.com')
  })
})

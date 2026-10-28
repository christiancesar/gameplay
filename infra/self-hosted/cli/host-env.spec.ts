import { describe, expect, it } from 'vitest'
import { targetOf } from './env-layout.ts'
import { HostEnv } from './host-env.ts'
import { envFixture } from './test/env-fixture.ts'
import { API_EXAMPLE, HOST_EXAMPLE, WEB_EXAMPLE } from './test/env-seed.ts'
import { useTemporaryDir } from './test/temporary-dir.ts'

describe('HostEnv', () => {
  const temporary = useTemporaryDir()

  function open() {
    const { paths } = envFixture(temporary, { host: HOST_EXAMPLE, api: API_EXAMPLE, web: WEB_EXAMPLE })
    return new HostEnv(paths)
  }

  it('reads and writes each variable in the file that owns it', () => {
    const env = open()

    env.set('BETTER_AUTH_SECRET', 'a')
    env.set('VITE_SENTRY_DSN', 'https://key@o1.ingest.sentry.io/2')
    env.set('WEB_PORT', '9000')

    expect(env.files.api.get('BETTER_AUTH_SECRET')).toBe('a')
    expect(env.files.web.get('VITE_SENTRY_DSN')).toBe('https://key@o1.ingest.sentry.io/2')
    expect(env.files.host.get('WEB_PORT')).toBe('9000')
    expect(env.get('BETTER_AUTH_SECRET')).toBe('a')
  })

  it('joins the three files in one set of values', () => {
    const env = open()
    env.set('BETTER_AUTH_SECRET', 'a')

    expect(env.values()).toMatchObject({ TUNNEL_MODE: 'quick', BETTER_AUTH_SECRET: 'a', VITE_SENTRY_DSN: '' })
  })

  it('keeps unknown variables in the host file', () => {
    expect(targetOf('SOMETHING_ELSE')).toBe('host')
    expect(targetOf('FARO_COLLECTOR_URL')).toBe('web')
    expect(targetOf('OTEL_EXPORTER_OTLP_HEADERS')).toBe('api')
    expect(targetOf('OTEL_DEPLOYMENT_ENVIRONMENT')).toBe('host')
  })
})

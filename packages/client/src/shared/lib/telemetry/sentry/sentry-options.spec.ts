import { describe, expect, it } from 'vitest'

import type { TelemetryConfig } from '@/shared/platform/platform'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { propagationTargets, sentryOptions, TRACES_SAMPLE_RATE } from './sentry-options'

const config = (overrides: Partial<TelemetryConfig> = {}): TelemetryConfig => ({
  ...new FakePlatform().telemetry,
  sentry: { dsn: 'https://key@o1.ingest.sentry.io/2', tunnel: '/monitoring/sentry' },
  ...overrides,
})

describe('propagationTargets', () => {
  it('follows the /api of the page itself', () => {
    const [own] = propagationTargets('web', '')

    expect(own?.test('/api/servers')).toBe(true)
    expect(own?.test('/uploads/a.png')).toBe(false)
    expect(propagationTargets('web', '')).toHaveLength(1)
  })

  it('follows the /api of the server the app talks to, and nothing else on the internet', () => {
    const targets = propagationTargets('web', 'https://play.example.com')
    const matches = (url: string) => targets.some((target) => target.test(url))

    expect(matches('https://play.example.com/api/servers')).toBe(true)
    expect(matches('https://play.example.com/uploads/a.png')).toBe(false)
    expect(matches('https://other.example.com/api/servers')).toBe(false)
    expect(matches('https://playXexample.com/api/servers')).toBe(false)
  })
})

describe('propagationTargets on the desktop, before a server is picked', () => {
  const matches = (url: string) => propagationTargets('desktop', '').some((target) => target.test(url))

  it('follows the /api of any server, since the user picks it later', () => {
    expect(matches('https://play.example.com/api/servers')).toBe(true)
    expect(matches('http://localhost:3333/api/servers')).toBe(true)
  })

  it('leaves the rest alone', () => {
    expect(matches('https://play.example.com/uploads/a.png')).toBe(false)
    expect(matches('https://play.example.com/monitoring/sentry')).toBe(false)
  })
})

describe('sentryOptions', () => {
  it('names the app, the environment and the release, and samples the traces', () => {
    const options = sentryOptions(config({ app: 'desktop', environment: 'production', release: 'x@1' }), '', {})

    expect(options).toMatchObject({
      dsn: 'https://key@o1.ingest.sentry.io/2',
      environment: 'production',
      release: 'x@1',
      initialScope: { tags: { app: 'desktop' } },
      tracesSampleRate: TRACES_SAMPLE_RATE,
    })
  })

  it('sends through the tunnel of the server', () => {
    expect(sentryOptions(config(), '', {}).tunnel).toBe('/monitoring/sentry')
    expect(sentryOptions(config(), 'https://play.example.com', {}).tunnel).toBe(
      'https://play.example.com/monitoring/sentry',
    )
    expect(sentryOptions(config({ sentry: { dsn: 'https://k@o1.ingest.sentry.io/2' } }), '', {}).tunnel).toBeUndefined()
  })

  it('adds the W3C trace header only while Faro does not', () => {
    expect(sentryOptions(config({ faro: null }), '', {}).propagateTraceparent).toBe(true)
    expect(sentryOptions(config({ faro: { url: '/monitoring/faro' } }), '', {}).propagateTraceparent).toBe(false)
  })
})

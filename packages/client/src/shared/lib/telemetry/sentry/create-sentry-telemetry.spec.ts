import { describe, expect, it, vi } from 'vitest'

import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { createSentryTelemetry } from './create-sentry-telemetry'

describe('createSentryTelemetry', () => {
  it('stays off without a DSN', () => {
    expect(createSentryTelemetry(new FakePlatform().telemetry, '', {})).toBeNull()
  })

  it('hands the options and the framework init to the host that starts Sentry itself', () => {
    const start = vi.fn()
    const { telemetry } = new FakePlatform({
      telemetry: { sentry: { dsn: 'https://key@o1.ingest.sentry.io/2', start } },
    })

    const created = createSentryTelemetry(telemetry, '', {})

    expect(created).not.toBeNull()
    expect(start).toHaveBeenCalledTimes(1)
    expect(start.mock.calls[0]?.[0]).toMatchObject({ dsn: 'https://key@o1.ingest.sentry.io/2' })
    expect(start.mock.calls[0]?.[1]).toBeTypeOf('function')
  })
})

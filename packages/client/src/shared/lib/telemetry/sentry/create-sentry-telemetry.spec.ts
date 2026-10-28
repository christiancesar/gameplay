import { describe, expect, it } from 'vitest'

import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { createSentryTelemetry } from './create-sentry-telemetry'

describe('createSentryTelemetry', () => {
  it('stays off without a DSN', () => {
    expect(createSentryTelemetry(new FakePlatform().telemetry, '', {})).toBeNull()
  })
})

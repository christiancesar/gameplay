import { describe, expect, it } from 'vitest'

import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { NoopTelemetry } from './noop.telemetry'
import { createTelemetry } from './create-telemetry'

describe('createTelemetry', () => {
  it('stays off when the config turns nothing on', () => {
    const { telemetry } = new FakePlatform()

    const created = createTelemetry(telemetry, '', {})

    expect(created).toBeInstanceOf(NoopTelemetry)
    expect(created.measuring).toBe(false)
  })
})

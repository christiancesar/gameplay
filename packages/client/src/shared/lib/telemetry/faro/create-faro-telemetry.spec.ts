import { describe, expect, it } from 'vitest'

import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { createFaroTelemetry } from './create-faro-telemetry'

describe('createFaroTelemetry', () => {
  it('stays off without a collector', () => {
    expect(createFaroTelemetry(new FakePlatform().telemetry, '')).toBeNull()
  })
})

import { afterEach, describe, expect, it } from 'vitest'

import { installTelemetry, telemetry } from './current-telemetry'
import { NoopTelemetry } from './noop.telemetry'
import { FakeTelemetry } from './test/fake-telemetry'

describe('telemetry', () => {
  afterEach(() => installTelemetry(new NoopTelemetry()))

  it('says nothing until an app installs one', () => {
    expect(telemetry.measuring).toBe(false)
    expect(() => telemetry.captureError(new Error('boom'))).not.toThrow()
  })

  it('forwards to the installed telemetry, and follows a new one', () => {
    const first = new FakeTelemetry()
    installTelemetry(first)
    telemetry.setUser({ id: 'u1' })
    telemetry.measure({ name: 'webrtc', values: { rtt_ms: 1 } })
    expect(first.user).toEqual({ id: 'u1' })
    expect(first.measurements).toHaveLength(1)
    expect(telemetry.measuring).toBe(true)

    const second = new FakeTelemetry({ measuring: false })
    installTelemetry(second)
    telemetry.clearUser()
    expect(telemetry.measuring).toBe(false)
    expect(first.user).toEqual({ id: 'u1' })
  })
})

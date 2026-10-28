import { describe, expect, it } from 'vitest'

import { NoopTelemetry } from './noop.telemetry'

describe('NoopTelemetry', () => {
  it('takes every call and keeps none', () => {
    const telemetry = new NoopTelemetry()

    expect(() => {
      telemetry.captureError(new Error('boom'), { roomId: 'r1' })
      telemetry.log('info', 'hello')
      telemetry.measure({ name: 'webrtc', values: { rtt_ms: 40 } })
      telemetry.setUser({ id: 'u1' })
      telemetry.clearUser()
      telemetry.setView('/')
    }).not.toThrow()
    expect(telemetry.measuring).toBe(false)
  })
})

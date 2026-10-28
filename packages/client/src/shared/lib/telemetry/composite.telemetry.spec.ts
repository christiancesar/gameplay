import { describe, expect, it } from 'vitest'

import { CompositeTelemetry } from './composite.telemetry'
import { FakeTelemetry } from './test/fake-telemetry'
import { ThrowingTelemetry } from './test/throwing-telemetry'

describe('CompositeTelemetry', () => {
  it('sends every call to every provider', () => {
    const first = new FakeTelemetry()
    const second = new FakeTelemetry()
    const telemetry = new CompositeTelemetry([first, second])
    const error = new Error('boom')

    telemetry.captureError(error, { roomId: 'r1' })
    telemetry.log('warn', 'slow', { source: 'x' })
    telemetry.measure({ name: 'webrtc', values: { rtt_ms: 40 }, attributes: { connection: 'relay' } })
    telemetry.setUser({ id: 'u1' })
    telemetry.setView('/servers/$serverId')

    for (const provider of [first, second]) {
      expect(provider.errors).toEqual([{ error, context: { roomId: 'r1' } }])
      expect(provider.logs).toEqual([{ level: 'warn', message: 'slow', attributes: { source: 'x' } }])
      expect(provider.measurements).toHaveLength(1)
      expect(provider.user).toEqual({ id: 'u1' })
      expect(provider.views).toEqual(['/servers/$serverId'])
    }
    telemetry.clearUser()
    expect(first.user).toBeNull()
    expect(second.user).toBeNull()
  })

  it('measures when any provider does', () => {
    expect(new CompositeTelemetry([new FakeTelemetry({ measuring: false })]).measuring).toBe(false)
    expect(
      new CompositeTelemetry([new FakeTelemetry({ measuring: false }), new FakeTelemetry({ measuring: true })])
        .measuring,
    ).toBe(true)
  })

  it('does not let a provider that fails stop the others', () => {
    const working = new FakeTelemetry()
    const telemetry = new CompositeTelemetry([new ThrowingTelemetry(), working])

    expect(() => telemetry.measure({ name: 'webrtc', values: {} })).not.toThrow()
    expect(working.measurements).toHaveLength(1)
  })
})

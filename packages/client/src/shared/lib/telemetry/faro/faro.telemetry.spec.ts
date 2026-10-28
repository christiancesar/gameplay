import { describe, expect, it, vi } from 'vitest'

import { FaroTelemetry } from './faro.telemetry'

const api = () => ({
  setUser: vi.fn(),
  resetUser: vi.fn(),
  setView: vi.fn(),
  pushMeasurement: vi.fn(),
  pushLog: vi.fn(),
})

describe('FaroTelemetry', () => {
  it('sends a measurement as Faro does today: its name is the type, its attributes the context', () => {
    const fake = api()
    const telemetry = new FaroTelemetry(fake)

    telemetry.measure({ name: 'webrtc', values: { rtt_ms: 40 }, attributes: { connection: 'relay' } })

    expect(telemetry.measuring).toBe(true)
    expect(fake.pushMeasurement).toHaveBeenCalledWith(
      { type: 'webrtc', values: { rtt_ms: 40 } },
      { context: { connection: 'relay' }, skipDedupe: true },
    )
  })

  it('sends the user id, the view and the logs', () => {
    const fake = api()
    const telemetry = new FaroTelemetry(fake)

    telemetry.setUser({ id: 'u1' })
    telemetry.clearUser()
    telemetry.setView('/servers/$serverId')
    telemetry.log('warn', 'slow', { source: 'x' })

    expect(fake.setUser).toHaveBeenCalledWith({ id: 'u1' })
    expect(fake.resetUser).toHaveBeenCalled()
    expect(fake.setView).toHaveBeenCalledWith({ name: '/servers/$serverId' })
    expect(fake.pushLog).toHaveBeenCalledWith(['slow'], { level: 'warn', context: { source: 'x' } })
  })

  it('leaves errors to Sentry', () => {
    const fake = api()

    new FaroTelemetry(fake).captureError(new Error('boom'))

    expect(Object.values(fake).every((call) => call.mock.calls.length === 0)).toBe(true)
  })
})

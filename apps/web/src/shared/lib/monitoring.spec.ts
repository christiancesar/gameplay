import { describe, expect, it, vi } from 'vitest'

import { createMonitoring } from './monitoring'

function fakeSdk() {
  return { captureException: vi.fn(), setUser: vi.fn() }
}

describe('monitoring', () => {
  it('does nothing without an SDK (no DSN)', () => {
    const monitoring = createMonitoring(null)
    expect(() => {
      monitoring.captureError(new Error('boom'), { roomId: 'r1' })
      monitoring.setUser({ id: 'u1' })
      monitoring.clearUser()
    }).not.toThrow()
  })

  it('forwards errors with their context', () => {
    const sdk = fakeSdk()
    const error = new Error('boom')
    createMonitoring(sdk).captureError(error, { roomId: 'r1' })
    expect(sdk.captureException).toHaveBeenCalledWith(error, { extra: { roomId: 'r1' } })
  })

  it('forwards errors without context', () => {
    const sdk = fakeSdk()
    const error = new Error('boom')
    createMonitoring(sdk).captureError(error)
    expect(sdk.captureException).toHaveBeenCalledWith(error, undefined)
  })

  it('sends measurements and the user id to Faro, and skips them without it', () => {
    const metrics = { measure: vi.fn(), setUser: vi.fn() }
    const monitoring = createMonitoring(null, metrics)
    const measurement = { type: 'webrtc', values: { rtt_ms: 40 }, context: { connection: 'relay' } }

    monitoring.measure(measurement)
    monitoring.setUser({ id: 'u1', email: 'a@b.c' } as { id: string })
    monitoring.clearUser()

    expect(monitoring.measuring).toBe(true)
    expect(metrics.measure).toHaveBeenCalledWith(measurement)
    expect(metrics.setUser).toHaveBeenNthCalledWith(1, { id: 'u1' })
    expect(metrics.setUser).toHaveBeenNthCalledWith(2, null)
    expect(createMonitoring(null).measuring).toBe(false)
  })

  it('sets only the user id and clears it on sign-out', () => {
    const sdk = fakeSdk()
    const monitoring = createMonitoring(sdk)
    monitoring.setUser({ id: 'u1', email: 'a@b.c' } as { id: string })
    monitoring.clearUser()
    expect(sdk.setUser).toHaveBeenNthCalledWith(1, { id: 'u1' })
    expect(sdk.setUser).toHaveBeenNthCalledWith(2, null)
  })
})

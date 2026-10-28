import { describe, expect, it, vi } from 'vitest'

import { SentryTelemetry } from './sentry.telemetry'

const sdk = () => ({ captureException: vi.fn(), setUser: vi.fn() })

describe('SentryTelemetry', () => {
  it('forwards errors with their context as extra data', () => {
    const fake = sdk()
    const error = new Error('boom')

    new SentryTelemetry(fake).captureError(error, { roomId: 'r1' })

    expect(fake.captureException).toHaveBeenCalledWith(error, { extra: { roomId: 'r1' } })
  })

  it('forwards errors without context', () => {
    const fake = sdk()
    const error = new Error('boom')

    new SentryTelemetry(fake).captureError(error)

    expect(fake.captureException).toHaveBeenCalledWith(error, undefined)
  })

  it('sets only the user id and clears it on sign-out', () => {
    const fake = sdk()
    const telemetry = new SentryTelemetry(fake)

    telemetry.setUser({ id: 'u1', email: 'a@b.c' } as { id: string })
    telemetry.clearUser()

    expect(fake.setUser).toHaveBeenNthCalledWith(1, { id: 'u1' })
    expect(fake.setUser).toHaveBeenNthCalledWith(2, null)
  })

  it('leaves measurements to the provider that has them', () => {
    expect(new SentryTelemetry(sdk()).measuring).toBe(false)
  })
})

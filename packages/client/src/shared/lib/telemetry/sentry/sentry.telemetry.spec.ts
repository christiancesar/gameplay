import { describe, expect, it, vi } from 'vitest'

import { SentryTelemetry } from './sentry.telemetry'

function sdk() {
  return {
    captureException: vi.fn(),
    setUser: vi.fn(),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    metrics: { distribution: vi.fn() },
  }
}

describe('SentryTelemetry', () => {
  it('forwards errors with their context as extra data', () => {
    const fake = sdk()
    const error = new Error('boom')

    new SentryTelemetry(fake, 'web').captureError(error, { roomId: 'r1' })

    expect(fake.captureException).toHaveBeenCalledWith(error, { extra: { roomId: 'r1' } })
  })

  it('forwards errors without context', () => {
    const fake = sdk()
    const error = new Error('boom')

    new SentryTelemetry(fake, 'web').captureError(error)

    expect(fake.captureException).toHaveBeenCalledWith(error, undefined)
  })

  it('sets only the user id and clears it on sign-out', () => {
    const fake = sdk()
    const telemetry = new SentryTelemetry(fake, 'web')

    telemetry.setUser({ id: 'u1', email: 'a@b.c' } as { id: string })
    telemetry.clearUser()

    expect(fake.setUser).toHaveBeenNthCalledWith(1, { id: 'u1' })
    expect(fake.setUser).toHaveBeenNthCalledWith(2, null)
  })

  it('sends a log at its level, marked with the app', () => {
    const fake = sdk()

    new SentryTelemetry(fake, 'desktop').log('warn', 'slow', { source: 'x' })

    expect(fake.logger.warn).toHaveBeenCalledWith('slow', { source: 'x', app: 'desktop' })
    expect(fake.logger.info).not.toHaveBeenCalled()
  })

  it('does not send application logs when disabled', () => {
    const fake = sdk()

    new SentryTelemetry(fake, 'desktop', false).log('error', 'hidden')

    expect(fake.logger.error).not.toHaveBeenCalled()
  })

  it('sends each value of a measurement as a distribution named after it, with the attributes and the app', () => {
    const fake = sdk()
    const telemetry = new SentryTelemetry(fake, 'web')

    telemetry.measure({ name: 'webrtc', values: { rtt_ms: 40, loss_pct: 0.5 }, attributes: { connection: 'relay' } })

    expect(telemetry.measuring).toBe(true)
    expect(fake.metrics.distribution).toHaveBeenCalledTimes(2)
    expect(fake.metrics.distribution).toHaveBeenCalledWith('webrtc.rtt_ms', 40, {
      attributes: { connection: 'relay', app: 'web' },
    })
    expect(fake.metrics.distribution).toHaveBeenCalledWith('webrtc.loss_pct', 0.5, {
      attributes: { connection: 'relay', app: 'web' },
    })
  })
})

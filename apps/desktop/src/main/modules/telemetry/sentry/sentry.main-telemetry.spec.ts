import { describe, expect, it, vi } from 'vitest'

import { SentryMainTelemetry } from './sentry.main-telemetry'

function sdk() {
  return {
    captureException: vi.fn(),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    metrics: { distribution: vi.fn() },
    flush: vi.fn(async () => true),
  }
}

describe('SentryMainTelemetry', () => {
  it('sends an error with its context as extra data', () => {
    const fake = sdk()
    const error = new Error('boom')

    new SentryMainTelemetry(fake).captureError(error, { module: 'audio' })

    expect(fake.captureException).toHaveBeenCalledWith(error, { extra: { module: 'audio' } })
  })

  it('sends a log at its level, with its attributes', () => {
    const fake = sdk()

    new SentryMainTelemetry(fake).log('warn', 'No PipeWire', { reason: 'missing' })

    expect(fake.logger.warn).toHaveBeenCalledWith('No PipeWire', { reason: 'missing' })
    expect(fake.logger.info).not.toHaveBeenCalled()
  })

  it('sends each value of a measurement as a distribution, marked as the main process of the desktop app', () => {
    const fake = sdk()

    new SentryMainTelemetry(fake).measure({ name: 'audio_share', values: { linked: 1 }, attributes: { mode: 'apps' } })

    expect(fake.metrics.distribution).toHaveBeenCalledWith('audio_share.linked', 1, {
      attributes: { mode: 'apps', app: 'desktop', process: 'main' },
    })
  })

  it('flushes with the time it was given', async () => {
    const fake = sdk()

    await new SentryMainTelemetry(fake).flush(2000)

    expect(fake.flush).toHaveBeenCalledWith(2000)
  })
})

import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { installTelemetry } from '@/shared/lib/telemetry/current-telemetry'
import { NoopTelemetry } from '@/shared/lib/telemetry/noop.telemetry'
import { FakeTelemetry } from '@/shared/lib/telemetry/test/fake-telemetry'
import { TelemetryErrorBoundary } from './telemetry-error-boundary'

function Broken(): never {
  throw new Error('render failed')
}

describe('TelemetryErrorBoundary', () => {
  afterEach(() => installTelemetry(new NoopTelemetry()))

  it('shows what is below while nothing fails', () => {
    render(
      <TelemetryErrorBoundary fallback={<p>fallback</p>}>
        <p>content</p>
      </TelemetryErrorBoundary>,
    )

    expect(screen.getByText('content')).toBeTruthy()
  })

  it('shows the fallback and reports the error when something below throws', () => {
    const telemetry = new FakeTelemetry()
    installTelemetry(telemetry)
    // React logs the error it caught.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TelemetryErrorBoundary fallback={<p>fallback</p>}>
        <Broken />
      </TelemetryErrorBoundary>,
    )

    expect(screen.getByText('fallback')).toBeTruthy()
    expect(telemetry.errors).toHaveLength(1)
    expect(telemetry.errors[0]?.error).toEqual(expect.objectContaining({ message: 'render failed' }))
    expect(telemetry.errors[0]?.context).toHaveProperty('componentStack')
    vi.restoreAllMocks()
  })
})

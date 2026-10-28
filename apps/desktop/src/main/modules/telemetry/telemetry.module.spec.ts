import { describe, expect, it, vi } from 'vitest'

// The Sentry SDK needs Electron itself, which a spec does not have.
vi.mock('./sentry/create-sentry-main-telemetry', () => ({ createSentryMainTelemetry: vi.fn() }))

import { NoopMainTelemetry } from './noop.main-telemetry'
import { createTelemetryModule } from './telemetry.module'

describe('createTelemetryModule', () => {
  it('reports nowhere when the build has no DSN', () => {
    expect(createTelemetryModule({ dsn: undefined, environment: 'development', release: 'x@1' })).toBeInstanceOf(
      NoopMainTelemetry,
    )
    expect(createTelemetryModule({ dsn: '', environment: 'development', release: 'x@1' })).toBeInstanceOf(
      NoopMainTelemetry,
    )
  })
})

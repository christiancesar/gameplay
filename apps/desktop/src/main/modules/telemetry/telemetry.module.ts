import type { MainTelemetry } from './main-telemetry'
import { NoopMainTelemetry } from './noop.main-telemetry'
import { createSentryMainTelemetry } from './sentry/create-sentry-main-telemetry'

type Options = { dsn: string | undefined; environment: string; release: string }

/** The main process's telemetry: Sentry when the build has a DSN, otherwise nothing. */
export function createTelemetryModule({ dsn, environment, release }: Options): MainTelemetry {
  return dsn ? createSentryMainTelemetry({ dsn, environment, release }) : new NoopMainTelemetry()
}

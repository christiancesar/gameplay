import type { TelemetryConfig } from '@/shared/platform/platform'

import { CompositeTelemetry } from './composite.telemetry'
import { createFaroTelemetry } from './faro/create-faro-telemetry'
import { NoopTelemetry } from './noop.telemetry'
import { createSentryTelemetry } from './sentry/create-sentry-telemetry'
import type { Telemetry } from './telemetry'

/**
 * The providers the config turns on, as one. `serverUrl` is the origin of the API (empty on the web): the paths of
 * the monitoring tunnels are on it. `router` is the TanStack router, which Sentry follows for its traces.
 */
function createTelemetry(config: TelemetryConfig, serverUrl: string, router: unknown): Telemetry {
  const providers = [createSentryTelemetry(config, serverUrl, router), createFaroTelemetry(config, serverUrl)].filter(
    (provider): provider is Telemetry => provider !== null,
  )
  return providers.length > 0 ? new CompositeTelemetry(providers) : new NoopTelemetry()
}

export { createTelemetry }

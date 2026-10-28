import type { TelemetryConfig } from '@/shared/platform/platform'

import { CompositeTelemetry } from './composite.telemetry'
import { createFaroTelemetry } from './faro/create-faro-telemetry'
import { NoopTelemetry } from './noop.telemetry'
import { createSentryTelemetry } from './sentry/create-sentry-telemetry'
import type { Telemetry } from './telemetry'

/**
 * The providers the config turns on, as one. `serverUrl` is the origin of the API (empty on the web): the paths of
 * the monitoring tunnels are on it.
 */
function createTelemetry(config: TelemetryConfig, serverUrl: string): Telemetry {
  const providers = [createSentryTelemetry(config, serverUrl), createFaroTelemetry(config, serverUrl)].filter(
    (provider): provider is Telemetry => provider !== null,
  )
  return providers.length > 0 ? new CompositeTelemetry(providers) : new NoopTelemetry()
}

export { createTelemetry }

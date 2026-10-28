import * as Sentry from '@sentry/react'

import type { TelemetryConfig } from '@/shared/platform/platform'

import type { Telemetry } from '../telemetry'
import { sentryOptions } from './sentry-options'
import { SentryTelemetry } from './sentry.telemetry'

/** Starts Sentry, tagged with the app that sends; null (and nothing started) without a DSN. */
function createSentryTelemetry(config: TelemetryConfig, serverUrl: string, router: unknown): Telemetry | null {
  if (!config.sentry) return null
  const options = sentryOptions(config, serverUrl, router)
  // A host with its own SDK around this one (Electron) starts it, handing over the framework's init.
  if (config.sentry.start) config.sentry.start(options, Sentry.init as (options: never) => void)
  else Sentry.init(options)
  return new SentryTelemetry(Sentry, config.app)
}

export { createSentryTelemetry }

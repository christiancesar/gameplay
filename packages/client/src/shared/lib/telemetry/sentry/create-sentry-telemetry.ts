import * as Sentry from '@sentry/react'

import type { TelemetryConfig } from '@/shared/platform/platform'

import { onServer } from '../../server-url'
import type { Telemetry } from '../telemetry'
import { scrubEvent } from './scrub-event'
import { SentryTelemetry } from './sentry.telemetry'

/** Starts Sentry for errors, tagged with the app that sends them; null (and nothing started) without a DSN. */
function createSentryTelemetry(config: TelemetryConfig, serverUrl: string): Telemetry | null {
  if (!config.sentry) return null
  const { dsn, tunnel } = config.sentry

  Sentry.init({
    dsn,
    environment: config.environment,
    release: config.release || undefined,
    initialScope: { tags: { app: config.app } },
    // Path of the server forwarded to Sentry, so ad blockers don't drop the events.
    tunnel: tunnel ? onServer(tunnel, serverUrl) : undefined,
    // v11 has no sendDefaultPii option: personal data is off unless opted in, and scrubEvent strips the rest.
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    beforeSend: scrubEvent,
  })
  return new SentryTelemetry(Sentry)
}

export { createSentryTelemetry }

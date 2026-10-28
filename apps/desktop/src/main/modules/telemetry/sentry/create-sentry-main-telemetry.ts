import * as Sentry from '@sentry/electron/main'

import type { MainTelemetry } from '../main-telemetry'
import { SentryMainTelemetry } from './sentry.main-telemetry'

type Options = { dsn: string; environment: string; release: string }

/**
 * Starts Sentry in the main process: uncaught exceptions and rejections, native crashes (the minidump of a crash
 * of the app or of the audio module) and the logs. Events wait on disk when the machine is offline. It must run
 * before the app is ready. The window has its own client; this one reports what the window cannot see.
 */
function createSentryMainTelemetry({ dsn, environment, release }: Options): MainTelemetry {
  Sentry.init({
    dsn,
    environment,
    release,
    initialScope: { tags: { app: 'desktop', process: 'main' } },
    // No user details leave (not even the IP): Sentry gives the install an anonymous id of its own.
    dataCollection: { userInfo: false, cookies: false },
    beforeSend: (event) => {
      delete event.server_name
      if (event.user) event.user = { id: event.user.id }
      return event
    },
  })
  return new SentryMainTelemetry(Sentry)
}

export { createSentryMainTelemetry }

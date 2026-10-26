import * as Sentry from '@sentry/react'

const SENSITIVE_HEADERS = ['cookie', 'authorization', 'set-cookie', 'x-csrf-token']

/** Removes cookies, auth headers and user identifiers from an event before it leaves the browser. */
function scrubEvent<T extends Sentry.ErrorEvent>(event: T): T {
  if (event.request) {
    delete event.request.cookies
    if (event.request.headers) {
      const headers: Record<string, string> = {}
      for (const [name, value] of Object.entries(event.request.headers)) {
        if (!SENSITIVE_HEADERS.includes(name.toLowerCase())) headers[name] = value
      }
      event.request.headers = headers
    }
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined
  return event
}

/**
 * Starts Sentry for errors only: performance and browser traces go to Grafana Faro.
 * Does nothing (returns false) when `VITE_SENTRY_DSN` is empty.
 */
function initSentry(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return false

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    // v11 has no sendDefaultPii option: personal data is off unless opted in, and scrubEvent strips the rest.
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    beforeSend: scrubEvent,
  })
  return true
}

export { initSentry, scrubEvent }

import type { ErrorEvent } from '@sentry/react'

const SENSITIVE_HEADERS = ['cookie', 'authorization', 'set-cookie', 'x-csrf-token']

/** Removes cookies, auth headers and user identifiers from an event before it leaves the browser. */
function scrubEvent<T extends ErrorEvent>(event: T): T {
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

export { scrubEvent }

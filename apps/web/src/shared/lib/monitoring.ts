import * as Sentry from '@sentry/react'

type ErrorContext = Record<string, unknown>

/** The slice of the Sentry SDK the app uses, so specs can pass a fake. */
type MonitoringSdk = {
  captureException: (error: unknown, hint?: { extra?: ErrorContext }) => unknown
  setUser: (user: { id: string } | null) => void
}

type Monitoring = {
  captureError: (error: unknown, context?: ErrorContext) => void
  setUser: (user: { id: string }) => void
  clearUser: () => void
}

/** Wrapper ViewModels use to report errors. Does nothing when `sdk` is null (no DSN). */
function createMonitoring(sdk: MonitoringSdk | null): Monitoring {
  return {
    captureError: (error, context) => {
      sdk?.captureException(error, context ? { extra: context } : undefined)
    },
    // Only the id leaves the browser: no email, username or IP.
    setUser: (user) => sdk?.setUser({ id: user.id }),
    clearUser: () => sdk?.setUser(null),
  }
}

const monitoring = createMonitoring(import.meta.env.VITE_SENTRY_DSN ? Sentry : null)

export { createMonitoring, monitoring }
export type { ErrorContext, Monitoring, MonitoringSdk }

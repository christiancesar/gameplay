import * as Sentry from '@sentry/react'

import { faroMetrics, type Measurement, type MetricsSdk } from './faro'

type ErrorContext = Record<string, unknown>

/** The slice of the Sentry SDK the app uses, so specs can pass a fake. */
type MonitoringSdk = {
  captureException: (error: unknown, hint?: { extra?: ErrorContext }) => unknown
  setUser: (user: { id: string } | null) => void
}

type Monitoring = {
  captureError: (error: unknown, context?: ErrorContext) => void
  /** A numeric sample (call quality, for instance) for Grafana. */
  measure: (measurement: Measurement) => void
  /** False without Faro: callers can skip collecting what `measure` would drop. */
  measuring: boolean
  setUser: (user: { id: string }) => void
  clearUser: () => void
}

/**
 * Wrapper ViewModels use to report errors (Sentry) and measurements (Faro). Each side does nothing when
 * its SDK is null (no DSN, no Faro URL).
 */
function createMonitoring(errors: MonitoringSdk | null, metrics: MetricsSdk | null = null): Monitoring {
  return {
    captureError: (error, context) => {
      errors?.captureException(error, context ? { extra: context } : undefined)
    },
    measure: (measurement) => metrics?.measure(measurement),
    measuring: metrics !== null,
    // Only the id leaves the browser: no email, username or IP.
    setUser: (user) => {
      errors?.setUser({ id: user.id })
      metrics?.setUser({ id: user.id })
    },
    clearUser: () => {
      errors?.setUser(null)
      metrics?.setUser(null)
    },
  }
}

const monitoring = createMonitoring(
  import.meta.env.VITE_SENTRY_DSN ? Sentry : null,
  import.meta.env.VITE_FARO_URL ? faroMetrics : null,
)

export { createMonitoring, monitoring }
export type { ErrorContext, Monitoring, MonitoringSdk }

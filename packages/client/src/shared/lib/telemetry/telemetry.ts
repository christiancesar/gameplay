type ErrorContext = Record<string, unknown>
type Attributes = Record<string, string>
type LogLevel = 'info' | 'warn' | 'error'

/** Numbers sampled together (the values) with the labels they belong to (the attributes). */
type Measurement = { name: string; values: Record<string, number>; attributes?: Attributes }

/**
 * What the app reports, whoever receives it. ViewModels and controllers talk to this and never to Sentry or Grafana
 * Faro: a provider (`sentry/`, `faro/`) turns each call into its SDK's, so changing the destination is a change of
 * configuration, not of screens. Every call is safe to make while nothing is listening.
 */
interface Telemetry {
  captureError(error: unknown, context?: ErrorContext): void
  log(level: LogLevel, message: string, attributes?: Attributes): void
  /** A numeric sample (call quality, for instance). */
  measure(measurement: Measurement): void
  /** Only the id leaves the browser: no email, username or IP. */
  setUser(user: { id: string }): void
  clearUser(): void
  /** The screen the user is on, by the route pattern (never the URL: no ids in the names). */
  setView(name: string): void
  /** False when nobody receives measurements: callers can skip collecting what `measure` would drop. */
  readonly measuring: boolean
}

export type { Attributes, ErrorContext, LogLevel, Measurement, Telemetry }

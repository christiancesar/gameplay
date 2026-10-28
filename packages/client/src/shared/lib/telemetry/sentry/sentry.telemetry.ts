import type { Attributes, ErrorContext, LogLevel, Measurement, Telemetry } from '../telemetry'

/** The slice of the Sentry SDK the app uses, so specs can pass a fake. */
type SentrySdk = {
  captureException: (error: unknown, hint?: { extra?: ErrorContext }) => unknown
  setUser: (user: { id: string } | null) => void
  logger: Record<LogLevel, (message: string, attributes?: Attributes) => void>
  metrics: { distribution: (name: string, value: number, options?: { attributes?: Attributes }) => void }
}

/**
 * Sentry: errors, logs, metrics and the user id. Traces and the name of the view come from its tracing
 * integration, which follows the router by itself, so `setView` has nothing to do.
 */
export class SentryTelemetry implements Telemetry {
  readonly measuring = true
  private readonly sdk: SentrySdk
  private readonly app: string

  /** `app` (web or desktop) goes on every log and metric, as the tag does on events. */
  constructor(sdk: SentrySdk, app: string) {
    this.sdk = sdk
    this.app = app
  }

  captureError(error: unknown, context?: ErrorContext): void {
    this.sdk.captureException(error, context ? { extra: context } : undefined)
  }

  log(level: LogLevel, message: string, attributes?: Attributes): void {
    this.sdk.logger[level](message, { ...attributes, app: this.app })
  }

  /** One distribution per value, named after the measurement: `webrtc.rtt_ms`. */
  measure({ name, values, attributes }: Measurement): void {
    for (const [key, value] of Object.entries(values)) {
      this.sdk.metrics.distribution(`${name}.${key}`, value, { attributes: { ...attributes, app: this.app } })
    }
  }

  setUser(user: { id: string }): void {
    this.sdk.setUser({ id: user.id })
  }

  clearUser(): void {
    this.sdk.setUser(null)
  }

  setView(_name: string): void {}
}

export type { SentrySdk }

import type { Attributes, ErrorContext, LogLevel, Measurement, Telemetry } from '../telemetry'

/** The slice of the Sentry SDK the app uses, so specs can pass a fake. */
type SentrySdk = {
  captureException: (error: unknown, hint?: { extra?: ErrorContext }) => unknown
  setUser: (user: { id: string } | null) => void
}

/**
 * Sentry. Today it carries errors and the user id; logs, measurements and the view name join it with TEL-02, so
 * those three calls do nothing yet (Grafana Faro still has them).
 */
export class SentryTelemetry implements Telemetry {
  readonly measuring = false
  private readonly sdk: SentrySdk

  constructor(sdk: SentrySdk) {
    this.sdk = sdk
  }

  captureError(error: unknown, context?: ErrorContext): void {
    this.sdk.captureException(error, context ? { extra: context } : undefined)
  }

  log(_level: LogLevel, _message: string, _attributes?: Attributes): void {}

  measure(_measurement: Measurement): void {}

  setUser(user: { id: string }): void {
    this.sdk.setUser({ id: user.id })
  }

  clearUser(): void {
    this.sdk.setUser(null)
  }

  setView(_name: string): void {}
}

export type { SentrySdk }

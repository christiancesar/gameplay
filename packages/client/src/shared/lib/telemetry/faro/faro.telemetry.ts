import type { Attributes, ErrorContext, LogLevel, Measurement, Telemetry } from '../telemetry'

/** The slice of Faro's API the app uses, so specs can pass a fake. */
type FaroApi = {
  setUser: (user: { id: string }) => void
  resetUser: () => void
  setView: (view: { name: string }) => void
  pushMeasurement: (
    measurement: { type: string; values: Record<string, number> },
    options?: { context?: Attributes; skipDedupe?: boolean },
  ) => void
  pushLog: (args: unknown[], options?: { level?: LogLevel; context?: Attributes }) => void
}

/**
 * Grafana Faro: Web Vitals, sessions and traces come from its own instrumentation; this carries what the app
 * sends by hand. Errors stay out (Sentry owns them), and so does `measuring` when there is no collector.
 */
export class FaroTelemetry implements Telemetry {
  readonly measuring = true
  private readonly api: FaroApi

  constructor(api: FaroApi) {
    this.api = api
  }

  captureError(_error: unknown, _context?: ErrorContext): void {}

  log(level: LogLevel, message: string, attributes?: Attributes): void {
    this.api.pushLog([message], { level, context: attributes })
  }

  measure({ name, values, attributes }: Measurement): void {
    this.api.pushMeasurement({ type: name, values }, { context: attributes, skipDedupe: true })
  }

  setUser(user: { id: string }): void {
    this.api.setUser({ id: user.id })
  }

  clearUser(): void {
    this.api.resetUser()
  }

  setView(name: string): void {
    this.api.setView({ name })
  }
}

export type { FaroApi }

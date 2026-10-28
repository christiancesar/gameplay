import type { Attributes, ErrorContext, LogLevel, Measurement, Telemetry } from '../telemetry'

/** Keeps what was reported, so a spec can look at it. */
export class FakeTelemetry implements Telemetry {
  readonly errors: { error: unknown; context?: ErrorContext }[] = []
  readonly logs: { level: LogLevel; message: string; attributes?: Attributes }[] = []
  readonly measurements: Measurement[] = []
  readonly views: string[] = []
  user: { id: string } | null = null
  readonly measuring: boolean

  constructor({ measuring = true }: { measuring?: boolean } = {}) {
    this.measuring = measuring
  }

  captureError(error: unknown, context?: ErrorContext): void {
    this.errors.push({ error, context })
  }

  log(level: LogLevel, message: string, attributes?: Attributes): void {
    this.logs.push({ level, message, attributes })
  }

  measure(measurement: Measurement): void {
    this.measurements.push(measurement)
  }

  setUser(user: { id: string }): void {
    this.user = user
  }

  clearUser(): void {
    this.user = null
  }

  setView(name: string): void {
    this.views.push(name)
  }
}

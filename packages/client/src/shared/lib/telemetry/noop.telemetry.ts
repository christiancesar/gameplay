import type { Attributes, ErrorContext, LogLevel, Measurement, Telemetry } from './telemetry'

/** Nothing is listening: no DSN, no collector. */
export class NoopTelemetry implements Telemetry {
  readonly measuring = false

  captureError(_error: unknown, _context?: ErrorContext): void {}
  log(_level: LogLevel, _message: string, _attributes?: Attributes): void {}
  measure(_measurement: Measurement): void {}
  setUser(_user: { id: string }): void {}
  clearUser(): void {}
  setView(_name: string): void {}
}

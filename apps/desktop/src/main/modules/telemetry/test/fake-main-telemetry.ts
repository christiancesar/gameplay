import type { LogLevel, MainTelemetry, Measurement } from '../main-telemetry'

/** Keeps what was reported, so a spec can look at it. */
export class FakeMainTelemetry implements MainTelemetry {
  readonly errors: { error: unknown; context?: Record<string, unknown> }[] = []
  readonly logs: { level: LogLevel; message: string; attributes?: Record<string, string> }[] = []
  readonly measurements: Measurement[] = []
  flushed = 0

  captureError(error: unknown, context?: Record<string, unknown>): void {
    this.errors.push({ error, context })
  }

  log(level: LogLevel, message: string, attributes?: Record<string, string>): void {
    this.logs.push({ level, message, attributes })
  }

  measure(measurement: Measurement): void {
    this.measurements.push(measurement)
  }

  async flush(_timeoutMs: number): Promise<void> {
    this.flushed++
  }
}

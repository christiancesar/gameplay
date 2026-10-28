type LogLevel = 'info' | 'warn' | 'error'

type Measurement = { name: string; values: Record<string, number>; attributes?: Record<string, string> }

/**
 * What the main process reports, whoever receives it: the same idea as the client's `Telemetry`, with the calls
 * the main process makes. A provider (`sentry/`) turns them into its SDK's, so the destination changes in one place.
 */
interface MainTelemetry {
  captureError(error: unknown, context?: Record<string, unknown>): void
  log(level: LogLevel, message: string, attributes?: Record<string, string>): void
  /** Numbers sampled together (the values) with the labels they belong to (the attributes): one metric per value. */
  measure(measurement: Measurement): void
  /** Sends what is waiting, up to `timeoutMs`. */
  flush(timeoutMs: number): Promise<void>
}

export type { LogLevel, MainTelemetry, Measurement }

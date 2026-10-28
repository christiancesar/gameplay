import type { LogLevel, MainTelemetry } from './main-telemetry'

/** No DSN in the build: nothing leaves the machine, and the local log is all there is. */
export class NoopMainTelemetry implements MainTelemetry {
  captureError(_error: unknown, _context?: Record<string, unknown>): void {}
  log(_level: LogLevel, _message: string, _attributes?: Record<string, string>): void {}
  async flush(_timeoutMs: number): Promise<void> {}
}

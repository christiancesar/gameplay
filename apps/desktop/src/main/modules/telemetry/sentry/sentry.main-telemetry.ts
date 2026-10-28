import type { LogLevel, MainTelemetry } from '../main-telemetry'

/** The slice of `@sentry/electron/main` that is used, so specs can pass a fake. */
type SentrySdk = {
  captureException: (error: unknown, hint?: { extra?: Record<string, unknown> }) => unknown
  logger: Record<LogLevel, (message: string, attributes?: Record<string, string>) => void>
  flush: (timeoutMs: number) => Promise<boolean>
}

/** Sentry for the main process: its exceptions, and the lines of the local log that are worth a look. */
export class SentryMainTelemetry implements MainTelemetry {
  private readonly sdk: SentrySdk

  constructor(sdk: SentrySdk) {
    this.sdk = sdk
  }

  captureError(error: unknown, context?: Record<string, unknown>): void {
    this.sdk.captureException(error, context ? { extra: context } : undefined)
  }

  log(level: LogLevel, message: string, attributes?: Record<string, string>): void {
    this.sdk.logger[level](message, attributes)
  }

  async flush(timeoutMs: number): Promise<void> {
    await this.sdk.flush(timeoutMs)
  }
}

export type { SentrySdk }

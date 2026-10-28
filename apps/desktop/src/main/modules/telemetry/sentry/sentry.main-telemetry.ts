import type { LogLevel, MainTelemetry, Measurement } from '../main-telemetry'

/** The slice of `@sentry/electron/main` that is used, so specs can pass a fake. */
type SentrySdk = {
  captureException: (error: unknown, hint?: { extra?: Record<string, unknown> }) => unknown
  logger: Record<LogLevel, (message: string, attributes?: Record<string, string>) => void>
  metrics: { distribution: (name: string, value: number, options?: { attributes?: Record<string, string> }) => void }
  flush: (timeoutMs: number) => Promise<boolean>
}

/** Sentry for the main process: its exceptions, the lines of the local log that are worth a look, and metrics. */
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

  /** One distribution per value, named after the measurement and marked as coming from the main process. */
  measure({ name, values, attributes }: Measurement): void {
    for (const [key, value] of Object.entries(values)) {
      this.sdk.metrics.distribution(`${name}.${key}`, value, {
        attributes: { ...attributes, app: 'desktop', process: 'main' },
      })
    }
  }

  async flush(timeoutMs: number): Promise<void> {
    await this.sdk.flush(timeoutMs)
  }
}

export type { SentrySdk }

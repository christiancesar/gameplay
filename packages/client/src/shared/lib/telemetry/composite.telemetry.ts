import type { Attributes, ErrorContext, LogLevel, Measurement, Telemetry } from './telemetry'

/** Sends everything to every provider: how two destinations run side by side while one replaces the other. */
export class CompositeTelemetry implements Telemetry {
  private readonly providers: readonly Telemetry[]

  constructor(providers: readonly Telemetry[]) {
    this.providers = providers
  }

  get measuring(): boolean {
    return this.providers.some((provider) => provider.measuring)
  }

  captureError(error: unknown, context?: ErrorContext): void {
    this.each((provider) => provider.captureError(error, context))
  }

  log(level: LogLevel, message: string, attributes?: Attributes): void {
    this.each((provider) => provider.log(level, message, attributes))
  }

  measure(measurement: Measurement): void {
    this.each((provider) => provider.measure(measurement))
  }

  setUser(user: { id: string }): void {
    this.each((provider) => provider.setUser(user))
  }

  clearUser(): void {
    this.each((provider) => provider.clearUser())
  }

  setView(name: string): void {
    this.each((provider) => provider.setView(name))
  }

  /** A provider that fails must not take the app, or the other provider, down with it. */
  private each(call: (provider: Telemetry) => void): void {
    for (const provider of this.providers) {
      try {
        call(provider)
      } catch {
        // Reporting is best effort.
      }
    }
  }
}

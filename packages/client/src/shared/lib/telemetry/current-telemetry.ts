import { NoopTelemetry } from './noop.telemetry'
import type { Telemetry } from './telemetry'

let current: Telemetry = new NoopTelemetry()

/**
 * What controllers and ViewModels import. It forwards to the telemetry the app installed once it knew its
 * platform and server, and does nothing before that (and in specs).
 */
const telemetry: Telemetry = {
  captureError: (error, context) => current.captureError(error, context),
  log: (level, message, attributes) => current.log(level, message, attributes),
  measure: (measurement) => current.measure(measurement),
  setUser: (user) => current.setUser(user),
  clearUser: () => current.clearUser(),
  setView: (name) => current.setView(name),
  get measuring() {
    return current.measuring
  },
}

function installTelemetry(next: Telemetry): void {
  current = next
}

export { installTelemetry, telemetry }

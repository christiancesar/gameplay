import type { Telemetry } from '../telemetry'

const fail = (): never => {
  throw new Error('provider down')
}

/** A provider whose every call fails. */
export class ThrowingTelemetry implements Telemetry {
  readonly measuring = true
  captureError = fail
  log = fail
  measure = fail
  setUser = fail
  clearUser = fail
  setView = fail
}

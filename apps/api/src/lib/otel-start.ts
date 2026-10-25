import { startTelemetry } from './otel'

// Imported first by main.ts, so telemetry starts before Nest and its
// dependencies are loaded.
startTelemetry()

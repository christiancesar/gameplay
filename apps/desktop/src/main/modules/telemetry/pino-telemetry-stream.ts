import { Writable } from 'node:stream'

import type { LogLevel, MainTelemetry } from './main-telemetry'

const LEVELS = new Set<string>(['info', 'warn', 'error'])
// Written by pino itself, not attributes of the event.
const OWN_KEYS = new Set(['level', 'time', 'pid', 'msg'])

const asText = (value: unknown): string => (typeof value === 'string' ? value : JSON.stringify(value))

/**
 * The lines of the local log, sent on as logs: a stream for pino's multistream. A line that is not JSON, or has a
 * level below info (the debug the renderer's console writes), is not sent.
 */
export function pinoTelemetryStream(telemetry: MainTelemetry): Writable {
  return new Writable({
    write(chunk: Buffer, _encoding, callback) {
      try {
        const line = JSON.parse(chunk.toString()) as Record<string, unknown>
        const level = String(line.level)
        if (LEVELS.has(level) && typeof line.msg === 'string') {
          const attributes = Object.fromEntries(
            Object.entries(line)
              .filter(([key]) => !OWN_KEYS.has(key))
              .map(([key, value]) => [key, asText(value)]),
          )
          telemetry.log(level as LogLevel, line.msg, attributes)
        }
      } catch {
        // Reporting is best effort.
      }
      callback()
    },
  })
}

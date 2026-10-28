import fs from 'node:fs'
import path from 'node:path'
import pino from 'pino'

import { rotateLog } from '../../utils/rotate-log'
import type { Logger } from './logger'

const MAX_BYTES = 5 * 1024 * 1024
const KEEP = 3

type Options = {
  /** Where `main.log` lives: `app.getPath('logs')`. */
  dir: string
  /** Also write to stderr, for `npm run desktop` in a terminal. */
  echo: boolean
  /** More places the lines go (the telemetry), with the lowest level each takes. */
  extraStreams?: pino.StreamEntry[]
}

/**
 * The log of the main process: one JSON line per event in `main.log`, asynchronous and without a worker thread
 * (a pino transport would need extra files in the bundle). The renderer's warnings and errors arrive here too.
 * A log that cannot be opened must never stop the app, so it falls back to a logger that writes nothing.
 */
export function createLoggingModule({ dir, echo, extraStreams = [] }: Options): { logger: Logger; file: string } {
  const file = path.join(dir, 'main.log')
  try {
    fs.mkdirSync(dir, { recursive: true })
    rotateLog(file, { maxBytes: MAX_BYTES, keep: KEEP })
    const streams: pino.StreamEntry[] = [{ stream: pino.destination({ dest: file, sync: false }) }]
    if (echo) streams.push({ stream: process.stderr })
    streams.push(...extraStreams)
    const logger = pino(
      {
        level: 'debug',
        base: { pid: process.pid },
        formatters: { level: (label) => ({ level: label }) },
        timestamp: pino.stdTimeFunctions.isoTime,
        serializers: { err: pino.stdSerializers.err },
      },
      pino.multistream(streams),
    )
    return { logger, file }
  } catch {
    return { logger: pino({ enabled: false }), file }
  }
}

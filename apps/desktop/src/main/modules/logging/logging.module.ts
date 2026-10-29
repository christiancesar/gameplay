import fs from 'node:fs'
import path from 'node:path'
import pino from 'pino'

import { rotateLog } from '../../utils/rotate-log'
import type { Logger } from './logger'
import { RotatingFileStream } from './rotating-file-stream'

// About 20 MB at most on disk: the file being written and `KEEP` older ones.
const MAX_BYTES = 5 * 1024 * 1024
const KEEP = 3

type Options = {
  /** Whether to create the bounded local log destination. */
  enabled?: boolean
  /** Where `main.log` lives: `app.getPath('logs')`. */
  dir: string
  /** Also write to stderr, for `npm run desktop:dev` in a terminal. */
  echo: boolean
  /** More places the lines go (the telemetry), with the lowest level each takes. */
  extraStreams?: pino.StreamEntry[]
}

/**
 * The log of the main process: one JSON line per event in `main.log`, from info up, without a worker thread (a pino
 * transport would need extra files in the bundle). The file stays inside a size (`RotatingFileStream`), so the log
 * never grows without limit. The renderer's warnings and errors arrive here too.
 * A log that cannot be opened must never stop the app, so it falls back to a logger that writes nothing.
 */
export function createLoggingModule({ enabled = true, dir, echo, extraStreams = [] }: Options): {
  logger: Logger
  file: string | null
} {
  const file = path.join(dir, 'main.log')
  if (!enabled) return { logger: pino({ enabled: false }), file: null }

  try {
    fs.mkdirSync(dir, { recursive: true })
    rotateLog(file, { maxBytes: MAX_BYTES, keep: KEEP })
    const streams: pino.StreamEntry[] = [
      { level: 'info', stream: new RotatingFileStream(file, { maxBytes: MAX_BYTES, keep: KEEP }) },
    ]
    if (echo) streams.push({ level: 'debug', stream: process.stderr })
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

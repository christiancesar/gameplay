import type { Logger } from '../logger'

type Entry = { level: 'debug' | 'info' | 'warn' | 'error'; data: unknown; message: string }

/** Keeps what was logged, in order, so a spec can look at it. */
export class FakeLogger implements Logger {
  readonly entries: Entry[] = []

  debug = (data: unknown, message?: string) => this.add('debug', data, message)
  info = (data: unknown, message?: string) => this.add('info', data, message)
  warn = (data: unknown, message?: string) => this.add('warn', data, message)
  error = (data: unknown, message?: string) => this.add('error', data, message)

  private add(level: Entry['level'], data: unknown, message?: string): void {
    // `logger.info('text')` has no data object.
    this.entries.push(
      typeof data === 'string' ? { level, data: {}, message: data } : { level, data, message: message ?? '' },
    )
  }
}

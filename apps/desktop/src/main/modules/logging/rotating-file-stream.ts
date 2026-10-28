import fs from 'node:fs'
import { Writable } from 'node:stream'

import { rotateNow } from '../../utils/rotate-log'

type Options = { maxBytes: number; keep: number }

/**
 * The file the log is written to, kept inside a limit while the app runs: when a line would take it past
 * `maxBytes`, `main.log` becomes `main.log.1` (the older ones move up, and only `keep` stay). The disk the log can
 * take is about `maxBytes * (keep + 1)` whatever the app does. Lines are written at once, so a crash loses none.
 */
export class RotatingFileStream extends Writable {
  private readonly file: string
  private readonly options: Options
  private fd: number
  private size: number

  constructor(file: string, options: Options) {
    super()
    this.file = file
    this.options = options
    this.fd = fs.openSync(file, 'a')
    this.size = fs.fstatSync(this.fd).size
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    try {
      if (this.size > 0 && this.size + chunk.length > this.options.maxBytes) this.rotate()
      fs.writeSync(this.fd, chunk)
      this.size += chunk.length
      callback()
    } catch (error) {
      callback(error as Error)
    }
  }

  override _final(callback: (error?: Error | null) => void): void {
    fs.closeSync(this.fd)
    callback()
  }

  private rotate(): void {
    fs.closeSync(this.fd)
    rotateNow(this.file, this.options.keep)
    this.fd = fs.openSync(this.file, 'a')
    this.size = 0
  }
}

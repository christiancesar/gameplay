import { EventEmitter } from 'node:events'

import type { HelperProcess } from '../providers/windows/windows-helper.system-audio.provider'

/** A child process that only says what a spec tells it to. */
export class FakeHelperProcess implements HelperProcess {
  readonly stdoutEvents = new EventEmitter()
  readonly stderrEvents = new EventEmitter()
  readonly events = new EventEmitter()
  stdinClosed = false
  killed = false

  readonly stdout = {
    on: (event: 'data', listener: (chunk: Uint8Array) => void) => this.stdoutEvents.on(event, listener),
  }
  readonly stderr = {
    on: (event: 'data', listener: (chunk: Uint8Array) => void) => this.stderrEvents.on(event, listener),
  }
  readonly stdin = {
    end: () => {
      this.stdinClosed = true
    },
  }

  on(event: 'exit' | 'error', listener: (arg: number | Error | null) => void): void {
    this.events.on(event, listener)
  }

  kill(): void {
    this.killed = true
  }

  /** The helper writes a line on stderr. */
  say(text: string): void {
    this.stderrEvents.emit('data', Buffer.from(text))
  }

  /** The helper writes PCM on stdout. */
  write(chunk: Uint8Array): void {
    this.stdoutEvents.emit('data', chunk)
  }

  exit(code: number | null): void {
    this.events.emit('exit', code)
  }
}

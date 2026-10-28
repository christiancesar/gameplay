import { SystemAudioProvider } from '../system-audio.provider'
import type { Logger } from '../../../logging/logger'

/** The part of a child process the provider uses, so a spec needs no real one. */
export type HelperProcess = {
  stdout: { on(event: 'data', listener: (chunk: Uint8Array) => void): unknown } | null
  stderr: { on(event: 'data', listener: (chunk: Uint8Array) => void): unknown } | null
  stdin: { end(): unknown } | null
  on(event: 'exit' | 'error', listener: (arg: number | Error | null) => void): unknown
  kill(): unknown
}

export type LaunchHelper = (executable: string, args: string[]) => HelperProcess

/** How long the helper has to say it is capturing before it counts as failed. */
const START_TIMEOUT_MS = 3000

/**
 * The Windows capture helper (native/audio-capture): it captures everything but this app's process tree and writes the
 * PCM on its stdout. It prints "capturing" on stderr once it runs, and stops when its stdin closes.
 */
export class WindowsHelperSystemAudioProvider extends SystemAudioProvider {
  private readonly executable: string | null
  private readonly ownPid: number
  private readonly launch: LaunchHelper
  private readonly exists: (path: string) => boolean
  private readonly logger: Logger
  private child: HelperProcess | null = null

  /** `executable` is null where there is no helper (not Windows); `ownPid` is the process the capture leaves out. */
  constructor(
    executable: string | null,
    ownPid: number,
    launch: LaunchHelper,
    exists: (path: string) => boolean,
    logger: Logger,
  ) {
    super()
    this.executable = executable
    this.ownPid = ownPid
    this.launch = launch
    this.exists = exists
    this.logger = logger
  }

  available(): boolean {
    return this.executable !== null && this.exists(this.executable)
  }

  start(onData: (chunk: Uint8Array) => void, onEnd: () => void): Promise<boolean> {
    if (!this.executable || !this.available()) return Promise.resolve(false)
    this.stop()
    const child = this.launch(this.executable, ['exclude', String(this.ownPid)])
    this.child = child

    return new Promise<boolean>((resolve) => {
      const settle = (started: boolean) => {
        clearTimeout(timer)
        resolve(started)
      }
      const timer = setTimeout(() => {
        this.logger.warn('The audio capture helper did not start in time')
        this.stop()
        settle(false)
      }, START_TIMEOUT_MS)

      child.stdout?.on('data', onData)
      child.stderr?.on('data', (chunk) => {
        const text = Buffer.from(chunk).toString().trim()
        this.logger.info({ helper: text }, 'Audio capture helper')
        if (text.includes('capturing')) settle(true)
      })
      child.on('error', (err) => {
        this.logger.warn({ err }, 'The audio capture helper could not run')
        if (this.child === child) this.child = null
        settle(false)
      })
      child.on('exit', (code) => {
        this.logger.info({ code }, 'Audio capture helper exited')
        const stoppedByUs = this.child !== child
        if (this.child === child) this.child = null
        settle(false)
        if (!stoppedByUs) onEnd()
      })
    })
  }

  stop(): void {
    const child = this.child
    this.child = null
    if (!child) return
    // The helper leaves when stdin closes; kill is for one that does not.
    child.stdin?.end()
    child.kill()
  }
}

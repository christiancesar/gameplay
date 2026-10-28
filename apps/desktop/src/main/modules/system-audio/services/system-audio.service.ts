import type { SystemAudioScope } from '@gameplay/desktop-bridge'

import type { SystemAudioProvider } from '../providers/system-audio.provider'

/** The sound of the computer without the app, for a share: starts and stops the capture and hands the PCM on. */
export class SystemAudioService {
  private readonly provider: SystemAudioProvider
  private readonly sink: (chunk: Uint8Array) => void
  private running = false

  /** `sink` gets the PCM, wherever it must go (the window). */
  constructor(provider: SystemAudioProvider, sink: (chunk: Uint8Array) => void) {
    this.provider = provider
    this.sink = sink
  }

  available(): boolean {
    return this.provider.available()
  }

  /** Starts the capture of the scope (the whole computer by default), or restarts it; tells whether it runs. */
  async start(scope: SystemAudioScope = { scope: 'system' }): Promise<boolean> {
    if (!this.provider.available()) return false
    this.stop()
    this.running = await this.provider.start(
      this.sink,
      () => {
        this.running = false
      },
      scope,
    )
    return this.running
  }

  /** Stops the capture; nothing to do when none runs. */
  stop(): void {
    if (!this.running) return
    this.running = false
    this.provider.stop()
  }
}

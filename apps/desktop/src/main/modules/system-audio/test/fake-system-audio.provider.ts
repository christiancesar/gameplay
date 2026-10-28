import type { SystemAudioScope } from '@gameplay/desktop-bridge'

import { SystemAudioProvider } from '../providers/system-audio.provider'

export class FakeSystemAudioProvider extends SystemAudioProvider {
  starts = 0
  scopes: SystemAudioScope[] = []
  stops = 0
  private readonly isAvailable: boolean
  private readonly starts_: boolean
  private emit: ((chunk: Uint8Array) => void) | null = null
  private ended: (() => void) | null = null

  constructor({ available = true, starts = true }: { available?: boolean; starts?: boolean } = {}) {
    super()
    this.isAvailable = available
    this.starts_ = starts
  }

  available(): boolean {
    return this.isAvailable
  }

  async start(onData: (chunk: Uint8Array) => void, onEnd: () => void, scope: SystemAudioScope): Promise<boolean> {
    this.starts += 1
    this.scopes.push(scope)
    this.emit = onData
    this.ended = onEnd
    return this.starts_
  }

  stop(): void {
    this.stops += 1
  }

  /** What the helper would write, for a spec. */
  data(chunk: Uint8Array): void {
    this.emit?.(chunk)
  }

  /** The helper going away on its own. */
  end(): void {
    this.ended?.()
  }
}

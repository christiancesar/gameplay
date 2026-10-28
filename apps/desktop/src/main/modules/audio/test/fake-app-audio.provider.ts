import type { AudioApp, AudioShare } from '@gameplay/desktop-bridge'

import { AppAudioProvider } from '../providers/app-audio.provider'

export class FakeAppAudioProvider extends AppAudioProvider {
  shared: AudioShare[] = []
  stops = 0
  private readonly isAvailable: boolean
  private readonly playing: AudioApp[]

  constructor({ available = true, playing = [] }: { available?: boolean; playing?: AudioApp[] } = {}) {
    super()
    this.isAvailable = available
    this.playing = playing
  }

  available(): boolean {
    return this.isAvailable
  }

  list(): AudioApp[] {
    return this.playing
  }

  share(target: AudioShare): boolean {
    this.shared.push(target)
    return true
  }

  stop(): void {
    this.stops += 1
  }
}

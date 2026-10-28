import type { AudioApp, AudioShare } from '@gameplay/desktop-bridge'

import type { AppAudioProvider } from '../providers/app-audio.provider'

/** The sound of other applications, for a share: which are playing, and the virtual microphone that carries it. */
export class AppAudioService {
  private readonly provider: AppAudioProvider
  private sharing = false

  constructor(provider: AppAudioProvider) {
    this.provider = provider
  }

  available(): boolean {
    return this.provider.available()
  }

  /** The applications playing sound now, by name. */
  list(): AudioApp[] {
    if (!this.provider.available()) return []
    return this.provider.list().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }

  share(target: AudioShare): boolean {
    if (!this.provider.available()) return false
    this.sharing = this.provider.share(target)
    return this.sharing
  }

  /** Takes the virtual microphone down; nothing to do when none was made. */
  stop(): void {
    if (!this.sharing) return
    this.sharing = false
    this.provider.stop()
  }
}

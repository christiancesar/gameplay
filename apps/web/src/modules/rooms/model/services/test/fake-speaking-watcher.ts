import { vi } from 'vitest'

import type { SpeakingWatcher } from '../voice-session.service'

class FakeSpeakingWatcher implements SpeakingWatcher {
  readonly watched = new Map<string, MediaStream>()
  readonly watch = vi.fn((id: string, stream: MediaStream) => void this.watched.set(id, stream))
  readonly unwatch = vi.fn((id: string) => void this.watched.delete(id))
  readonly dispose = vi.fn()
  private readonly onChange: (ids: readonly string[]) => void

  constructor(onChange: (ids: readonly string[]) => void) {
    this.onChange = onChange
  }

  speak(...ids: string[]) {
    this.onChange(ids)
  }
}

export { FakeSpeakingWatcher }

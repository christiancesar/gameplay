import { vi } from 'vitest'

import type { AudioEngine } from '@/shared/media/audio-engine'

class FakeAudioEngine implements AudioEngine {
  readonly addStream = vi.fn()
  readonly removeStream = vi.fn()
  readonly setVolume = vi.fn()
  readonly setDeafened = vi.fn()
  readonly setSinkId = vi.fn(async () => true)
  readonly createMeter = vi.fn(() => ({ read: () => 0, dispose: () => undefined }))
  readonly dispose = vi.fn()
}

export { FakeAudioEngine }

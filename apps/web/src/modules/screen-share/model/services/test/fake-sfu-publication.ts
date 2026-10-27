import { vi } from 'vitest'

import type { StatsRecord } from '@/shared/media/media-transport'
import { FakeSender } from '@/shared/media/test/fake-peer-connection'

/** The screen on the SFU, as the share session sees it. */
class FakeSfuPublication {
  readonly sender = new FakeSender()
  stats: StatsRecord[] = []
  readonly close = vi.fn()

  constructor(encodings: RTCRtpEncodingParameters[] = []) {
    this.sender.parameters.encodings = encodings
  }

  senderOf() {
    return this.sender
  }

  async getStats() {
    return { forEach: (callback: (stats: StatsRecord) => void) => this.stats.forEach(callback) }
  }
}

export { FakeSfuPublication }

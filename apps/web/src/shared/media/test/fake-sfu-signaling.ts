import { vi } from 'vitest'

import type { SfuSignaling } from '../sfu-connection'

/** The API side of the SFU: answers publishes, offers on watches. `failing` makes the next publish throw. */
function createFakeSfuSignaling() {
  let sessions = 0
  const signaling = {
    failing: false,
    createSession: vi.fn(async () => `sfu-${++sessions}`),
    publish: vi.fn<SfuSignaling['publish']>(async (_sessionId, _offer, tracks) => {
      if (signaling.failing) throw new Error('SFU down')
      return {
        sessionDescription: { type: 'answer', sdp: 'sfu-answer' },
        requiresImmediateRenegotiation: false,
        tracks,
      }
    }),
    watch: vi.fn<SfuSignaling['watch']>(async () => ({
      sessionDescription: { type: 'offer', sdp: 'sfu-offer' },
      requiresImmediateRenegotiation: true,
      tracks: [
        { mid: '0', kind: 'video' },
        { mid: '1', kind: 'audio' },
      ],
    })),
    renegotiate: vi.fn<SfuSignaling['renegotiate']>(async () => undefined),
    close: vi.fn<SfuSignaling['close']>(async () => undefined),
  }
  return signaling
}

export { createFakeSfuSignaling }

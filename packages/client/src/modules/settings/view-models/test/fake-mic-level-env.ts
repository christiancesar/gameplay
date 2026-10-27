import { vi } from 'vitest'

import type { MicLevelEnv } from '../../model/services/mic-level.service'

/** Fake browser pieces for the level meter; frames only advance when the spec calls `runFrame`. */
function createFakeMicLevelEnv(sampleValue = 128) {
  const track = { stop: vi.fn() }
  const analyser = {
    fftSize: 0,
    getByteTimeDomainData: vi.fn((array: Uint8Array) => array.fill(sampleValue)),
  }
  const source = { connect: vi.fn() }
  const context = {
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => source),
    close: vi.fn(async () => undefined),
  }
  let pending: (() => void) | undefined
  const env: MicLevelEnv = {
    getUserMedia: vi.fn(async () => ({ getTracks: () => [track] }) as unknown as MediaStream),
    createAudioContext: () => context as unknown as ReturnType<MicLevelEnv['createAudioContext']>,
    requestFrame: (callback) => {
      pending = callback
      return 1
    },
    cancelFrame: vi.fn(() => {
      pending = undefined
    }),
  }
  return {
    env,
    track,
    analyser,
    source,
    context,
    runFrame: () => pending?.(),
  }
}

export { createFakeMicLevelEnv }

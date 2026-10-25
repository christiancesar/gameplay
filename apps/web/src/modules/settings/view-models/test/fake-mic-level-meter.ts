import { vi } from 'vitest'

import type { MicLevelMeter } from '../../model/services/mic-level.service'

/** `MicLevelMeter` whose start resolves on demand; `emit` pushes a level to the active listener. */
function createFakeMicLevelMeter() {
  const stop = vi.fn()
  let listener: ((level: number) => void) | undefined
  const meter: MicLevelMeter = {
    start: vi.fn(async (_deviceId, onLevel) => {
      listener = onLevel
      return stop
    }),
  }
  return { meter, stop, emit: (level: number) => listener?.(level) }
}

export { createFakeMicLevelMeter }

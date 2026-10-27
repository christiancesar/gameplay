import { vi } from 'vitest'

/** Stands in for `shared/media/fullscreen`: specs read what was asked and play the browser leaving it. */
const handlers = new Set<() => void>()

const fakeFullscreen = {
  enterStreamFullscreen: vi.fn(async () => true),
  exitStreamFullscreen: vi.fn(),
  onFullscreenExit: vi.fn((handler: () => void) => {
    handlers.add(handler)
    return () => handlers.delete(handler)
  }),
  /** The browser left fullscreen on its own (Esc). */
  browserExits() {
    for (const handler of [...handlers]) handler()
  },
}

export { fakeFullscreen }

import { vi } from 'vitest'

/** Stands in for `shareController`: ViewModel specs read what they asked of it. */
const fakeShareController = {
  start: vi.fn(async () => undefined),
  stop: vi.fn(async () => undefined),
  updateQuality: vi.fn(async () => undefined),
  dismissNotice: vi.fn(),
  watch: vi.fn(),
  stopWatching: vi.fn(),
  setStreamVolume: vi.fn(),
  dismissWatchFailure: vi.fn(),
}

export { fakeShareController }

import { vi } from 'vitest'

import type { CapturePlatform } from '@/modules/screen-share/model/rules/capture-platform'

/** Stands in for `shareController`: ViewModel specs read what they asked of it. */
const fakeShareController = {
  platform: vi.fn((): CapturePlatform => ({
    engine: 'chromium',
    chromiumMajor: 141,
    os: 'windows',
    browser: 'Chrome',
  })),
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

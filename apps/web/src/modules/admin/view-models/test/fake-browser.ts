import { vi } from 'vitest'

/** Replaces `browser.service`: clipboard and file download. */
const fakeBrowserModule = {
  copyText: vi.fn(async () => undefined),
  downloadTextFile: vi.fn(),
}

export { fakeBrowserModule }

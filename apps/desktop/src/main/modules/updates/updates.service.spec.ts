import { EventEmitter } from 'node:events'

import { describe, expect, it, vi } from 'vitest'

import { UpdatesService, WINDOWS_UPDATE_FEED_URL } from './updates.service'

class FakeUpdater extends EventEmitter {
  readonly setFeedURL = vi.fn()
  readonly checkForUpdates = vi.fn(async () => undefined)
}

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('UpdatesService', () => {
  it('does not check development, non-Windows, or Squirrel startup', () => {
    for (const options of [
      { isPackaged: false, platform: 'win32' as const, args: [] },
      { isPackaged: true, platform: 'linux' as const, args: [] },
      { isPackaged: true, platform: 'win32' as const, args: ['--squirrel-firstrun'] },
    ]) {
      const updater = new FakeUpdater()
      new UpdatesService({ updater, logger, ...options, delayMs: 0 }).start()
      expect(updater.setFeedURL).not.toHaveBeenCalled()
      expect(updater.checkForUpdates).not.toHaveBeenCalled()
    }
  })

  it('checks the official feed once after startup', async () => {
    const updater = new FakeUpdater()
    new UpdatesService({ updater, logger, isPackaged: true, platform: 'win32', args: [], delayMs: 0 }).start()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(updater.setFeedURL).toHaveBeenCalledWith({ url: WINDOWS_UPDATE_FEED_URL })
    expect(updater.checkForUpdates).toHaveBeenCalledOnce()
  })

  it('logs failures without throwing', async () => {
    const updater = new FakeUpdater()
    updater.checkForUpdates.mockRejectedValueOnce(new Error('offline'))
    new UpdatesService({ updater, logger, isPackaged: true, platform: 'win32', args: [], delayMs: 0 }).start()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Desktop update request could not start')
  })
})

import { describe, expect, it, vi } from 'vitest'

import { createVideoProfileCapabilities } from './video-profile-capabilities.service'

describe('video profile capabilities', () => {
  it('requires source rate, dimensions and encoder support for advanced rates', async () => {
    const encodingInfo = vi.fn(async (configuration: unknown) => ({
      supported: true,
      smooth: (configuration as { video: { framerate: number } }).video.framerate <= 100,
    }))
    const service = createVideoProfileCapabilities({ mediaCapabilities: { encodingInfo } })
    await expect(service.advancedFps({ width: 2560, height: 1080, refreshRate: 120 })).resolves.toEqual([75, 100])
    expect(encodingInfo).toHaveBeenCalledTimes(3)
    expect(encodingInfo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        video: expect.objectContaining({ width: 2560, height: 1080, framerate: 75 }),
      }),
    )
  })

  it('falls back without enough evidence', async () => {
    await expect(createVideoProfileCapabilities({}).advancedFps(null)).resolves.toEqual([])
  })
})

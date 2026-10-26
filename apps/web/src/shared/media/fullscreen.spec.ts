import { describe, expect, it, vi } from 'vitest'

import { toggleStreamFullscreen } from './fullscreen'

type Root = Parameters<typeof toggleStreamFullscreen>[0]

describe('toggleStreamFullscreen', () => {
  it('puts the stage around the video in fullscreen, never the video, and leaves it on the next call', () => {
    const stage = { requestFullscreen: vi.fn(async () => undefined) }
    const querySelector = vi.fn(() => stage)
    const exitFullscreen = vi.fn(async () => undefined)
    const root = { fullscreenElement: null as unknown, querySelector, exitFullscreen }

    toggleStreamFullscreen(root as unknown as Root)
    expect(querySelector).toHaveBeenCalledWith('[data-stream-stage]')
    expect(stage.requestFullscreen).toHaveBeenCalledTimes(1)

    root.fullscreenElement = stage
    toggleStreamFullscreen(root as unknown as Root)
    expect(exitFullscreen).toHaveBeenCalledTimes(1)
    expect(stage.requestFullscreen).toHaveBeenCalledTimes(1)
  })
})

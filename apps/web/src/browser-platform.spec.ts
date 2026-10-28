import { describe, expect, it, vi } from 'vitest'

import { createBrowserPlatform } from './browser-platform'

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

const track = () => ({ stop: vi.fn() }) as unknown as MediaStreamTrack
const streamOf = (video: MediaStreamTrack[], audio: MediaStreamTrack[] = []) =>
  ({
    getVideoTracks: () => video,
    getAudioTracks: () => audio,
    getTracks: () => [...video, ...audio],
  }) as unknown as MediaStream

const platformOf = (getDisplayMedia = vi.fn()) =>
  createBrowserPlatform({ getDisplayMedia, readBrowser: () => ({ userAgent: CHROME_WINDOWS }) })

describe('createBrowserPlatform', () => {
  it('is a browser that lets its own picker list the sources, on the page origin', async () => {
    const platform = platformOf()

    expect(platform.kind).toBe('browser')
    expect(platform.capabilities).toMatchObject({ listSources: false, globalHotkeys: false })
    expect(await platform.capture.listSources()).toEqual([])
    expect(platform.server.baseUrl()).toBe('')
    expect(platform.server.chooser).toBeUndefined()
  })

  it('reads the audio it can share from the browser and the system', () => {
    expect(platformOf().capabilities).toMatchObject({ windowAudio: false, systemAudio: true })
  })

  it('captures through the browser, with the options it was given', async () => {
    const video = track()
    const stream = streamOf([video])
    const getDisplayMedia = vi.fn().mockResolvedValue(stream)
    const options = { video: { frameRate: { ideal: 60 } } }

    const result = await platformOf(getDisplayMedia).capture.start({ options, sourceId: null })

    expect(getDisplayMedia).toHaveBeenCalledWith(options)
    expect(result).toEqual({ ok: true, capture: { stream, video, audio: null } })
  })

  it('reads a closed picker as a cancel', async () => {
    const closed = vi.fn().mockRejectedValue(Object.assign(new Error('closed'), { name: 'NotAllowedError' }))

    expect(await platformOf(closed).capture.start({ options: {}, sourceId: null })).toEqual({
      ok: false,
      reason: 'cancelled',
    })
  })
})

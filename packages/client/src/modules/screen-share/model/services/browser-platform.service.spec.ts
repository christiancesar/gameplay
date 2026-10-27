import { describe, expect, it, vi } from 'vitest'

import { fakeTrack } from '@/shared/media/test/media-fakes'

import { createBrowserPlatform } from './browser-platform.service'

const CHROME_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const FIREFOX_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0'

const platformOf = (userAgent: string) => createBrowserPlatform({ readBrowser: () => ({ userAgent }) })

describe('createBrowserPlatform', () => {
  it('is a browser that lets its own picker list the sources', async () => {
    const platform = platformOf(CHROME_LINUX)
    expect(platform.kind).toBe('browser')
    expect(platform.capabilities).toMatchObject({ listSources: false, globalHotkeys: false })
    expect(await platform.capture.listSources()).toEqual([])
  })

  it('reads the audio it can share from the browser and the system', () => {
    expect(platformOf(CHROME_LINUX).capabilities).toMatchObject({ windowAudio: false, systemAudio: false })
    expect(platformOf(CHROME_WINDOWS).capabilities).toMatchObject({ windowAudio: false, systemAudio: true })
    expect(platformOf(FIREFOX_WINDOWS).capabilities).toMatchObject({ windowAudio: false, systemAudio: false })
  })

  it('captures through the browser, with the options it was given', async () => {
    const video = fakeTrack('video')
    const stream = {
      getVideoTracks: () => [video],
      getAudioTracks: () => [],
      getTracks: () => [video],
    } as unknown as MediaStream
    const getDisplayMedia = vi.fn().mockResolvedValue(stream)
    const platform = createBrowserPlatform({ getDisplayMedia, readBrowser: () => ({ userAgent: CHROME_LINUX }) })
    const options = { video: { frameRate: { ideal: 60 } } }

    const result = await platform.capture.start({ options, sourceId: null })

    expect(getDisplayMedia).toHaveBeenCalledWith(options)
    expect(result).toEqual({ ok: true, capture: { stream, video, audio: null } })
  })

  it('reads a closed picker as a cancel', async () => {
    const getDisplayMedia = vi.fn().mockRejectedValue(Object.assign(new Error('closed'), { name: 'NotAllowedError' }))
    const platform = createBrowserPlatform({ getDisplayMedia, readBrowser: () => ({ userAgent: CHROME_LINUX }) })
    expect(await platform.capture.start({ options: {}, sourceId: null })).toEqual({ ok: false, reason: 'cancelled' })
  })
})

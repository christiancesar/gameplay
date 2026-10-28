import { describe, expect, it, vi } from 'vitest'

import { acquireScreen, stopScreen } from './screen-capture'
import { fakeTrack } from './test/media-fakes'

const streamOf = (video: MediaStreamTrack[], audio: MediaStreamTrack[] = []) =>
  ({
    getVideoTracks: () => video,
    getAudioTracks: () => audio,
    getTracks: () => [...video, ...audio],
  }) as unknown as MediaStream

const rejecting = (name: string) => vi.fn().mockRejectedValue(Object.assign(new Error(name), { name }))

describe('acquireScreen', () => {
  it('hands over the video and the audio the user shared', async () => {
    const video = fakeTrack('video')
    const audio = fakeTrack('audio')
    const stream = streamOf([video], [audio])
    const result = await acquireScreen({ video: true }, vi.fn().mockResolvedValue(stream))
    expect(result).toEqual({ ok: true, capture: { stream, video, audio } })
  })

  it('has no audio when the source gave none', async () => {
    const result = await acquireScreen({ video: true }, vi.fn().mockResolvedValue(streamOf([fakeTrack('video')])))
    expect(result).toMatchObject({ ok: true, capture: { audio: null } })
  })

  it('passes the options to the browser', async () => {
    const getDisplayMedia = vi.fn().mockResolvedValue(streamOf([fakeTrack('video')]))
    await acquireScreen({ video: { frameRate: { ideal: 60 } } }, getDisplayMedia)
    expect(getDisplayMedia).toHaveBeenCalledWith({ video: { frameRate: { ideal: 60 } } })
  })

  it('reads a closed picker as a cancel', async () => {
    expect(await acquireScreen({}, rejecting('NotAllowedError'))).toEqual({ ok: false, reason: 'cancelled' })
    expect(await acquireScreen({}, rejecting('AbortError'))).toEqual({ ok: false, reason: 'cancelled' })
  })

  it('reports any other error as a failure', async () => {
    expect(await acquireScreen({}, rejecting('NotReadableError'))).toEqual({ ok: false, reason: 'failed' })
  })

  it('fails and releases a stream without video', async () => {
    const stop = vi.fn()
    const audio = { ...fakeTrack('audio'), stop } as MediaStreamTrack
    expect(await acquireScreen({}, vi.fn().mockResolvedValue(streamOf([], [audio])))).toEqual({
      ok: false,
      reason: 'failed',
    })
    expect(stop).toHaveBeenCalled()
  })

  it('stops every track of a capture', () => {
    const stops = [vi.fn(), vi.fn()]
    const tracks = stops.map((stop) => ({ ...fakeTrack('video'), stop }) as MediaStreamTrack)
    stopScreen({ stream: streamOf(tracks), video: tracks[0], audio: null })
    for (const stop of stops) expect(stop).toHaveBeenCalledTimes(1)
  })
})

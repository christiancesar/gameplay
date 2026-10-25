import { describe, expect, it, vi } from 'vitest'

import { acquireMicrophone, stopMicrophone, voiceConstraints } from './microphone'
import { fakeStream, fakeTrack } from './test/media-fakes'

const failure = (name: string) => Object.assign(new Error(name), { name })

describe('acquireMicrophone', () => {
  it('returns the stream and its track, with voice processing on', async () => {
    const stream = fakeStream([fakeTrack()])
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    const result = await acquireMicrophone('mic-1', getUserMedia)
    expect(result).toEqual({ ok: true, microphone: { stream, track: stream.getAudioTracks()[0] } })
    expect(getUserMedia).toHaveBeenCalledWith(voiceConstraints('mic-1'))
    expect(voiceConstraints('mic-1').audio).toMatchObject({
      deviceId: { exact: 'mic-1' },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    })
    expect(voiceConstraints(undefined).audio).not.toHaveProperty('deviceId')
  })

  it.each(['NotAllowedError', 'SecurityError'])('reports denied on %s', async (name) => {
    await expect(acquireMicrophone(undefined, vi.fn().mockRejectedValue(failure(name)))).resolves.toEqual({
      ok: false,
      reason: 'denied',
    })
  })

  it('reports unavailable when there is no device or no audio track', async () => {
    await expect(acquireMicrophone(undefined, vi.fn().mockRejectedValue(failure('NotFoundError')))).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    })
    await expect(acquireMicrophone(undefined, vi.fn().mockResolvedValue(fakeStream([])))).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    })
  })

  it('falls back to the default device when the chosen one is gone', async () => {
    const stream = fakeStream()
    const getUserMedia = vi.fn().mockRejectedValueOnce(failure('OverconstrainedError')).mockResolvedValueOnce(stream)
    const result = await acquireMicrophone('old-mic', getUserMedia)
    expect(result.ok).toBe(true)
    expect(getUserMedia).toHaveBeenLastCalledWith(voiceConstraints(undefined))
  })

  it('stops every track', () => {
    const track = fakeTrack()
    const stop = vi.spyOn(track, 'stop')
    stopMicrophone({ stream: fakeStream([track]), track })
    expect(stop).toHaveBeenCalled()
  })
})

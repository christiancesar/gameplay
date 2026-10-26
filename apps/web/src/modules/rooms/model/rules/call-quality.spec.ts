import { describe, expect, it } from 'vitest'

import { CONNECTING, DIRECT_WITH_SCREENS, RELAYED_VOICE, RELAYED_VOICE_LATER } from '../services/test/webrtc-stats-seed'
import { toCallQuality, toConnectionSample } from './call-quality'

describe('toConnectionSample', () => {
  it('is null while the connection has no working candidate pair', () => {
    expect(toConnectionSample(CONNECTING)).toBeNull()
    expect(toConnectionSample([])).toBeNull()
  })

  it('reads a relayed voice connection', () => {
    expect(toConnectionSample(RELAYED_VOICE)).toEqual({
      relay: true,
      rttMs: 42,
      audioIn: { packetsReceived: 990, packetsLost: 10, jitterMs: 12 },
      videoIn: null,
      videoOut: null,
    })
  })

  it('finds the pair in use without a transport entry and reads both screens', () => {
    const sample = toConnectionSample(DIRECT_WITH_SCREENS)

    expect(sample?.relay).toBe(false)
    expect(sample?.videoIn).toEqual({ packetsReceived: 5000, packetsLost: 0, jitterMs: 4, fps: 59.6, height: 1080 })
    expect(sample?.videoOut).toEqual({ fps: 29.8, height: 720, limited: true })
  })
})

describe('toCallQuality', () => {
  it('reports loss since the start of the connection on the first reading', () => {
    const quality = toCallQuality(toConnectionSample(RELAYED_VOICE)!)

    expect(quality).toEqual({
      values: { rtt_ms: 42, audio_jitter_ms: 12, audio_loss_ratio: 0.01 },
      context: { connection: 'relay' },
    })
  })

  it('reports loss between two readings afterwards', () => {
    const first = toConnectionSample(RELAYED_VOICE)!
    const later = toConnectionSample(RELAYED_VOICE_LATER)!

    expect(toCallQuality(later, first).values).toMatchObject({ audio_jitter_ms: 20, audio_loss_ratio: 0.01 })
  })

  it('reports screens in and out, rounded', () => {
    expect(toCallQuality(toConnectionSample(DIRECT_WITH_SCREENS)!)).toEqual({
      values: {
        screen_in_fps: 60,
        screen_in_height: 1080,
        screen_in_jitter_ms: 4,
        screen_in_loss_ratio: 0,
        screen_out_fps: 30,
        screen_out_height: 720,
        screen_out_limited: 1,
      },
      context: { connection: 'direct' },
    })
  })
})

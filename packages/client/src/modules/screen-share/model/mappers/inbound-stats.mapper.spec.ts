import { describe, expect, it } from 'vitest'

import { toInboundSample, toReceivedQuality } from './inbound-stats.mapper'
import { inbound } from '../services/test/screen-seed'

describe('inbound stats mapper', () => {
  it('reads the entry of the watched track, not one left from an earlier screen', () => {
    const records = [
      inbound({ trackIdentifier: 'old', frameHeight: 720, bytesReceived: 9_000_000 }),
      inbound({ trackIdentifier: 'screen-video' }),
      { type: 'inbound-rtp', kind: 'audio', trackIdentifier: 'game' },
    ]
    expect(toInboundSample(records, 'screen-video')).toEqual({
      width: 1920,
      height: 1080,
      fps: 60,
      bytesReceived: 0,
      timestamp: 1000,
    })
    expect(toInboundSample(records, 'missing')).toBeNull()
  })

  it('without track ids, takes the video that received the most', () => {
    const records = [inbound({ frameHeight: 720, bytesReceived: 10 }), inbound({ bytesReceived: 500 })]
    expect(toInboundSample(records, 'screen-video')?.height).toBe(1080)
  })

  it('waits for decoded frames', () => {
    expect(toInboundSample([inbound({ trackIdentifier: 'v', frameWidth: undefined })], 'v')).toBeNull()
  })

  it('rates the bytes between two samples', () => {
    const first = toInboundSample([inbound({ trackIdentifier: 'v' })], 'v')!
    const second = toInboundSample([inbound({ trackIdentifier: 'v', bytesReceived: 500_000, timestamp: 2000 })], 'v')!
    expect(toReceivedQuality(first, undefined)).toBeNull()
    expect(toReceivedQuality(second, first)).toEqual({ width: 1920, height: 1080, fps: 60, kbps: 4000 })
  })
})

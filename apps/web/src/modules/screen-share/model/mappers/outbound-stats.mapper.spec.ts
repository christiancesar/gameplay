import { describe, expect, it } from 'vitest'

import { outbound } from '../services/test/screen-seed'
import { toOutboundSample, toViewerStat } from './outbound-stats.mapper'

describe('outbound stats mapper', () => {
  it('reads size, rate, bytes and limitation from the outbound video entry', () => {
    const sample = toOutboundSample([
      { type: 'candidate-pair', bytesSent: 99 },
      { type: 'outbound-rtp', kind: 'audio', bytesSent: 5 },
      outbound({ bytesSent: 500, timestamp: 42, qualityLimitationReason: 'cpu' }),
    ])
    expect(sample).toEqual({ width: 1920, height: 1080, fps: 60, bytesSent: 500, timestamp: 42, limitation: 'cpu' })
  })

  it('accepts the older mediaType field', () => {
    expect(toOutboundSample([outbound({ kind: undefined, mediaType: 'video' })])).not.toBeNull()
  })

  it('maps the limitation reasons, unknown ones to none', () => {
    const reason = (value: unknown) => toOutboundSample([outbound({ qualityLimitationReason: value })])?.limitation
    expect(reason('bandwidth')).toBe('bandwidth')
    expect(reason('other')).toBe('other')
    expect(reason('none')).toBe('none')
    expect(reason(undefined)).toBe('none')
  })

  it('is null before the encoder produced a frame, or without the entry', () => {
    expect(toOutboundSample([])).toBeNull()
    expect(toOutboundSample([outbound({ frameWidth: undefined, frameHeight: undefined })])).toBeNull()
    expect(toOutboundSample([outbound({ bytesSent: 'x' })])).toBeNull()
  })

  it('has no rate until a second sample exists', () => {
    const first = toOutboundSample([outbound()])!
    expect(toViewerStat(first, undefined)).toBeNull()
  })

  it('works the rate out of the bytes sent between two samples', () => {
    const before = toOutboundSample([outbound({ bytesSent: 1_000_000, timestamp: 1000 })])!
    const after = toOutboundSample([outbound({ bytesSent: 2_250_000, timestamp: 2500, framesPerSecond: 58 })])!
    expect(toViewerStat(after, before)).toEqual({
      width: 1920,
      height: 1080,
      fps: 58,
      kbps: (1_250_000 * 8) / 1000 / 1.5,
      limitation: 'none',
    })
  })

  it('ignores a sample that is not newer, and never goes below zero', () => {
    const a = toOutboundSample([outbound({ bytesSent: 100, timestamp: 1000 })])!
    expect(toViewerStat(a, a)).toBeNull()
    const reset = toOutboundSample([outbound({ bytesSent: 10, timestamp: 2000 })])!
    expect(toViewerStat(reset, a)?.kbps).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'

import { iceRenewalDelayMs } from './ice-renewal'
import { diffPeers } from './peer-roster'
import { RESUME_WINDOW_MS, callToResume } from './resume-call'
import { peerRetryDelayMs } from './retry-delay'
import { isMicSilenced } from './voice-effective'
import { toGain, volumeOf } from './volume'

describe('voice rules', () => {
  it('turns a percent into a gain inside 0 to 2', () => {
    expect(toGain(100)).toBe(1)
    expect(toGain(150)).toBe(1.5)
    expect(toGain(500)).toBe(2)
    expect(toGain(-5)).toBe(0)
  })

  it('defaults the volume of someone to 100', () => {
    expect(volumeOf({ u2: 40 }, 'u2')).toBe(40)
    expect(volumeOf({}, 'u3')).toBe(100)
  })

  it('tells who to connect to and who to drop, never the local user', () => {
    expect(diffPeers(new Set(['u2', 'u3']), ['u1', 'u3', 'u4'], 'u1')).toEqual({
      added: ['u4'],
      removed: ['u2'],
    })
  })

  it('doubles the retry wait up to a cap', () => {
    expect([0, 1, 2, 3, 4, 10].map(peerRetryDelayMs)).toEqual([2000, 4000, 8000, 15000, 15000, 15000])
  })

  it('renews the ICE config before it expires', () => {
    expect(iceRenewalDelayMs(0)).toBeNull()
    expect(iceRenewalDelayMs(86400)).toBe((86400 - 90) * 1000)
    expect(iceRenewalDelayMs(100)).toBe(50_000)
  })

  it('silences the microphone for mute or deafen', () => {
    expect(isMicSilenced({ muted: false, deafened: false })).toBe(false)
    expect(isMicSilenced({ muted: true, deafened: false })).toBe(true)
    expect(isMicSilenced({ muted: false, deafened: true })).toBe(true)
  })

  it('resumes a call only when the page left it within the seat grace', () => {
    const left = { serverId: 's1', roomId: 'r1', leftAt: 1_000 }
    expect(callToResume(left, 1_000 + RESUME_WINDOW_MS)).toEqual({ serverId: 's1', roomId: 'r1' })
    expect(callToResume(left, 1_001 + RESUME_WINDOW_MS)).toBeNull()
    expect(callToResume(left, 999)).toBeNull()
    expect(callToResume({ ...left, leftAt: null }, 1_000)).toBeNull()
    expect(callToResume(null, 1_000)).toBeNull()
  })
})

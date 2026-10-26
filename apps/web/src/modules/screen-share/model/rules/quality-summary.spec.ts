import { describe, expect, it } from 'vitest'

import type { ViewerStat } from '../entities/share'
import { effectiveTarget, isViewerOnTarget, summarizeQuality, worstOf } from './quality-summary'

const stat = (overrides: Partial<ViewerStat> = {}): ViewerStat => ({
  width: 1920,
  height: 1080,
  fps: 60,
  kbps: 8000,
  limitation: 'none',
  ...overrides,
})
const target = { resolution: '1080p', fps: 60 } as const

describe('quality summary rules', () => {
  it('has nothing to say without viewers', () => {
    expect(summarizeQuality([], target, null)).toEqual({ delivering: undefined, isOnTarget: true, limitation: 'none' })
  })

  it('is on target within 5 % of the target', () => {
    expect(isViewerOnTarget(stat({ fps: 57.5 }), target, null)).toBe(true)
    expect(isViewerOnTarget(stat({ fps: 56 }), target, null)).toBe(false)
    expect(isViewerOnTarget(stat({ height: 720 }), target, null)).toBe(false)
  })

  it('takes the worst viewer: lower resolution first, then lower rate', () => {
    const best = stat()
    const lowFps = stat({ fps: 30 })
    const lowRes = stat({ height: 720, width: 1280, fps: 60 })
    expect(worstOf([best, lowFps, lowRes])).toBe(lowRes)
    expect(worstOf([best, lowFps])).toBe(lowFps)
    expect(worstOf([])).toBeUndefined()
  })

  it('delivers the worst quality with the upload of all viewers added', () => {
    const summary = summarizeQuality(
      [stat({ kbps: 8000 }), stat({ height: 720, width: 1280, fps: 42, kbps: 2000, limitation: 'bandwidth' })],
      target,
      null,
    )
    expect(summary.delivering).toEqual({ width: 1280, height: 720, fps: 42, kbps: 10_000 })
    expect(summary.isOnTarget).toBe(false)
    expect(summary.limitation).toBe('bandwidth')
  })

  it('reports no limitation while on target, even if the encoder says so', () => {
    expect(summarizeQuality([stat({ limitation: 'cpu' })], target, null).limitation).toBe('none')
  })

  it('names the cpu when the computer cannot hold the rate', () => {
    const summary = summarizeQuality([stat({ fps: 27, limitation: 'cpu' })], target, null)
    expect(summary).toMatchObject({ isOnTarget: false, limitation: 'cpu' })
  })

  it('does not ask a small or slow source for more than it has', () => {
    const smallWindow = { height: 720, fps: 30 }
    expect(effectiveTarget(target, smallWindow)).toEqual({ height: 720, fps: 30 })
    expect(effectiveTarget(target, null)).toEqual({ height: 1080, fps: 60 })
    expect(summarizeQuality([stat({ height: 720, width: 1280, fps: 30 })], target, smallWindow).isOnTarget).toBe(true)
    expect(effectiveTarget({ resolution: '720p', fps: 30 }, { height: 1440, fps: 144 })).toEqual({
      height: 720,
      fps: 30,
    })
  })
})

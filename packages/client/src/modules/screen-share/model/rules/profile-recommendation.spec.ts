import { describe, expect, it } from 'vitest'

import { closestAspectRatio, recommendShareProfile } from './profile-recommendation'

describe('share profile recommendation', () => {
  it('recognizes consumer ultrawide screens', () => {
    expect(closestAspectRatio({ width: 2560, height: 1080 })).toBe('21:9')
  })

  it('uses source ratio without dimensions and keeps base frame rates', () => {
    expect(recommendShareProfile(null)).toEqual({
      availableFps: [30, 60],
      recommended: { resolution: '1080p', aspectRatio: 'source', fps: 60 },
    })
  })

  it('recommends the source size and highest verified rate', () => {
    expect(recommendShareProfile({ width: 1600, height: 900, refreshRate: 120 }, [75, 100, 120])).toEqual({
      availableFps: [30, 60, 75, 100, 120],
      recommended: { resolution: '720p', aspectRatio: '16:9', fps: 120 },
    })
  })
})

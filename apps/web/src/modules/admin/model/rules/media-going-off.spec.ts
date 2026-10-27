import { describe, expect, it } from 'vitest'

import { effectiveMedia, mediaGoingOff } from './media-going-off'

const ALL_ON = { sfu: true, mesh: true, turn: true }

describe('media rules', () => {
  it('the server override wins over the global setting', () => {
    expect(effectiveMedia({ ...ALL_ON, sfu: false }, { sfu: true, mesh: false, turn: null })).toEqual({
      sfu: true,
      mesh: false,
      turn: true,
    })
    expect(effectiveMedia(ALL_ON)).toEqual(ALL_ON)
  })

  it('lists only what goes from on to off', () => {
    expect(mediaGoingOff({ ...ALL_ON, mesh: false }, { sfu: false, mesh: true, turn: false })).toEqual(['sfu', 'turn'])
  })
})

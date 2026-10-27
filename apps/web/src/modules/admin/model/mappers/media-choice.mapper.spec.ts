import { describe, expect, it } from 'vitest'

import { fromMediaChoices, toMediaChoices } from './media-choice.mapper'

describe('media choice mapper', () => {
  it('goes both ways between overrides and choices', () => {
    const overrides = { sfu: null, mesh: true, turn: false }
    expect(toMediaChoices(overrides)).toEqual({ sfu: 'global', mesh: 'on', turn: 'off' })
    expect(fromMediaChoices(toMediaChoices(overrides))).toEqual(overrides)
  })
})

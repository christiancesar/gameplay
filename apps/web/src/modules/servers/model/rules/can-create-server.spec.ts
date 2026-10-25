import { describe, expect, it } from 'vitest'

import { canCreateServer } from './can-create-server'

const base = { ownedCount: 0, limitOverride: null, refusedAtOwnedCount: null }

describe('canCreateServer', () => {
  it('allows when nothing is known', () => {
    expect(canCreateServer(base)).toBe(true)
    expect(canCreateServer({ ...base, ownedCount: 3 })).toBe(true)
  })

  it('blocks when the override is reached', () => {
    expect(canCreateServer({ ...base, ownedCount: 2, limitOverride: 2 })).toBe(false)
    expect(canCreateServer({ ...base, ownedCount: 3, limitOverride: 2 })).toBe(false)
  })

  it('allows below the override', () => {
    expect(canCreateServer({ ...base, ownedCount: 1, limitOverride: 2 })).toBe(true)
  })

  it('blocks everything with an override of 0', () => {
    expect(canCreateServer({ ...base, limitOverride: 0 })).toBe(false)
  })

  it('blocks once the API refused at this owned count', () => {
    expect(canCreateServer({ ...base, ownedCount: 1, refusedAtOwnedCount: 1 })).toBe(false)
  })

  it('unblocks when the user owns fewer servers than at the refusal', () => {
    expect(canCreateServer({ ...base, ownedCount: 0, refusedAtOwnedCount: 1 })).toBe(true)
  })
})

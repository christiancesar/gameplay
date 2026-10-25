import { describe, expect, it } from 'vitest'

import { canCreateServer } from './can-create-server'

describe('canCreateServer', () => {
  it('allows while the limits are not loaded', () => {
    expect(canCreateServer(undefined)).toBe(true)
  })

  it('allows below the limit', () => {
    expect(canCreateServer({ maxServers: 2, ownedServers: 1 })).toBe(true)
  })

  it('blocks at and above the limit', () => {
    expect(canCreateServer({ maxServers: 2, ownedServers: 2 })).toBe(false)
    expect(canCreateServer({ maxServers: 2, ownedServers: 3 })).toBe(false)
  })

  it('blocks everything with a limit of 0', () => {
    expect(canCreateServer({ maxServers: 0, ownedServers: 0 })).toBe(false)
  })
})

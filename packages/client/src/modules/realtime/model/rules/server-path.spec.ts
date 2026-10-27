import { describe, expect, it } from 'vitest'

import { isOnServerPath } from './server-path'

describe('isOnServerPath', () => {
  it('matches the server page and its sub pages', () => {
    expect(isOnServerPath('/servers/s1', 's1')).toBe(true)
    expect(isOnServerPath('/servers/s1/', 's1')).toBe(true)
    expect(isOnServerPath('/servers/s1/settings', 's1')).toBe(true)
  })

  it('does not match other servers, even with the same prefix', () => {
    expect(isOnServerPath('/servers/s10', 's1')).toBe(false)
    expect(isOnServerPath('/servers/s2', 's1')).toBe(false)
    expect(isOnServerPath('/', 's1')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { canManageServer } from './can-manage-server'

describe('canManageServer', () => {
  it.each([
    ['owner', true],
    ['admin', true],
    ['member', false],
  ] as const)('%s -> %s', (role, expected) => {
    expect(canManageServer(role)).toBe(expected)
  })
})

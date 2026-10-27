import { describe, expect, it } from 'vitest'

import { displayNameOf } from './display-name'

describe('displayNameOf', () => {
  it('prefers the username as typed over the sign up name, which does not follow a rename', () => {
    expect(displayNameOf({ name: 'admin', username: 'christiancesar', displayUsername: 'ChristianCesar' })).toBe(
      'ChristianCesar',
    )
    expect(displayNameOf({ name: 'admin', username: 'christiancesar', displayUsername: null })).toBe('christiancesar')
    expect(displayNameOf({ name: 'admin' })).toBe('admin')
    expect(displayNameOf({})).toBe('')
  })
})

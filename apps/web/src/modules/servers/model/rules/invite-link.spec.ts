import { describe, expect, it } from 'vitest'

import { inviteLink } from './invite-link'

describe('inviteLink', () => {
  it('joins the origin and the code', () => {
    expect(inviteLink('https://gameplay.test', 'JH34SD32')).toBe('https://gameplay.test/i/JH34SD32')
  })
})

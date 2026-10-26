import { describe, expect, it } from 'vitest'

import { inviteCodeFromPath, inviteLandingPath } from './invite-path'

describe('inviteLandingPath', () => {
  it('builds the invite page path', () => {
    expect(inviteLandingPath('JH34SD32')).toBe('/i/JH34SD32')
  })
})

describe('inviteCodeFromPath', () => {
  it('reads the code of an invite path', () => {
    expect(inviteCodeFromPath('/i/JH34SD32')).toBe('JH34SD32')
  })

  it.each([undefined, '', '/', '/servers/abc', '/i/', '/i/short', '/x/i/JH34SD32', '/i/JH34SD32/extra', '//evil.com'])(
    'returns null for %s',
    (path) => {
      expect(inviteCodeFromPath(path)).toBeNull()
    },
  )
})

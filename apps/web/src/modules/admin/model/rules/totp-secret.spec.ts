import { describe, expect, it } from 'vitest'

import { totpSecret } from './totp-secret'

describe('totpSecret', () => {
  it('reads the secret from the otpauth URI', () => {
    const uri = 'otpauth://totp/Gameplay:admin%40gameplay.local?secret=MFTHG5BU&issuer=Gameplay&digits=6&period=30'
    expect(totpSecret(uri)).toBe('MFTHG5BU')
  })

  it('returns an empty string when there is no secret', () => {
    expect(totpSecret('otpauth://totp/Gameplay:a?issuer=Gameplay')).toBe('')
  })

  it('returns an empty string for something that is not a URI', () => {
    expect(totpSecret('not a uri')).toBe('')
  })
})

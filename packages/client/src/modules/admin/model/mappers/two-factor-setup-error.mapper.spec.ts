import { describe, expect, it } from 'vitest'

import { mapTwoFactorSetupError } from './two-factor-setup-error.mapper'

describe('mapTwoFactorSetupError', () => {
  it('sends a wrong password to the password field', () => {
    expect(mapTwoFactorSetupError({ code: 'INVALID_PASSWORD', status: 400 })).toEqual({ target: 'password' })
  })

  it('sends a wrong code to the code field', () => {
    expect(mapTwoFactorSetupError({ code: 'INVALID_CODE', status: 401 })).toEqual({ target: 'code' })
  })

  it('uses a toast for the rate limit', () => {
    expect(mapTwoFactorSetupError({ status: 429 })).toEqual({ target: 'toast', key: 'tooManyAttempts' })
  })

  it('uses an unexpected toast for anything else', () => {
    expect(mapTwoFactorSetupError({ status: 500 })).toEqual({ target: 'toast', key: 'unexpected' })
    expect(mapTwoFactorSetupError({})).toEqual({ target: 'toast', key: 'unexpected' })
  })
})

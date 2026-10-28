import { describe, expect, it } from 'vitest'

import { isTwoFactorSessionLost, mapSignInError, mapSignUpError, mapTwoFactorError } from './auth-error.mapper'

describe('mapSignInError', () => {
  it.each(['INVALID_EMAIL_OR_PASSWORD', 'INVALID_USERNAME_OR_PASSWORD'])('maps %s to invalidCredentials', (code) => {
    expect(mapSignInError({ code, status: 401 })).toBe('invalidCredentials')
  })

  it('maps a banned user to accountSuspended', () => {
    expect(mapSignInError({ code: 'BANNED_USER', status: 403 })).toBe('accountSuspended')
  })

  it('does not treat any 403 as suspended', () => {
    expect(mapSignInError({ code: 'SOMETHING_ELSE', status: 403 })).toBe('invalidCredentials')
  })

  it('maps 429 to tooManyAttempts', () => {
    expect(mapSignInError({ status: 429 })).toBe('tooManyAttempts')
  })

  it('maps network and server failures to unexpected', () => {
    expect(mapSignInError({})).toBe('unexpected')
    expect(mapSignInError({ status: 500 })).toBe('unexpected')
  })
})

describe('mapTwoFactorError', () => {
  it.each(['INVALID_CODE', 'INVALID_BACKUP_CODE'])('maps %s to invalidTwoFactorCode', (code) => {
    expect(mapTwoFactorError({ code, status: 401 })).toBe('invalidTwoFactorCode')
  })

  it('maps 429 to tooManyAttempts', () => {
    expect(mapTwoFactorError({ status: 429 })).toBe('tooManyAttempts')
  })

  it('maps unknown codes to unexpected', () => {
    expect(mapTwoFactorError({ code: 'NOPE', status: 400 })).toBe('unexpected')
  })

  it('detects a lost two-factor session', () => {
    expect(isTwoFactorSessionLost({ code: 'INVALID_TWO_FACTOR_COOKIE' })).toBe(true)
    expect(isTwoFactorSessionLost({ code: 'INVALID_CODE' })).toBe(false)
  })
})

describe('mapSignUpError', () => {
  it('maps the registration key error to the inviteKey field', () => {
    expect(mapSignUpError({ code: 'INVALID_REGISTRATION_KEY', status: 400 })).toEqual({
      fieldErrors: { inviteKey: 'inviteKeyInvalid' },
    })
  })

  it('maps a taken username to the username field', () => {
    expect(mapSignUpError({ code: 'USERNAME_IS_ALREADY_TAKEN', status: 400 })).toEqual({
      fieldErrors: { username: 'usernameTaken' },
    })
  })

  it.each(['USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'])('maps %s to the email field', (code) => {
    expect(mapSignUpError({ code, status: 422 })).toEqual({ fieldErrors: { email: 'emailTaken' } })
  })

  it('maps 429 to tooManyAttempts on the inviteKey field', () => {
    expect(mapSignUpError({ status: 429 })).toEqual({ fieldErrors: { inviteKey: 'tooManyAttempts' } })
  })

  it('matches codes exactly, not by substring', () => {
    expect(mapSignUpError({ code: 'SOME_USERNAME_PROBLEM', status: 400 })).toEqual({ formError: 'unexpected' })
  })

  it('falls back to a form error', () => {
    expect(mapSignUpError({ code: 'VALIDATION_FAILED', status: 400 })).toEqual({ formError: 'unexpected' })
  })
})

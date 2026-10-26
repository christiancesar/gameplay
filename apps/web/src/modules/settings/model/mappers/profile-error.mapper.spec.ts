import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { mapChangePasswordError, mapUsernameError } from './profile-error.mapper'

const failure = (code: string, status = 400) => new ApiError({ code, message: '' }, status)

describe('mapUsernameError', () => {
  it('maps the taken username code, with or without the suffix', () => {
    expect(mapUsernameError(failure('USERNAME_IS_ALREADY_TAKEN'))).toBe('usernameTaken')
    expect(mapUsernameError(failure('USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER'))).toBe('usernameTaken')
  })

  it('treats everything else as unexpected', () => {
    expect(mapUsernameError(failure('INVALID_USERNAME'))).toBe('unexpected')
    expect(mapUsernameError(new Error('offline'))).toBe('unexpected')
  })
})

describe('mapChangePasswordError', () => {
  it('maps a wrong current password', () => {
    expect(mapChangePasswordError(failure('INVALID_PASSWORD'))).toBe('invalidPassword')
  })

  it('treats everything else as unexpected', () => {
    expect(mapChangePasswordError(failure('NETWORK_ERROR'))).toBe('unexpected')
    expect(mapChangePasswordError(failure('TOO_MANY_REQUESTS', 429))).toBe('unexpected')
  })
})

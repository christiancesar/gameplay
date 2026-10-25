import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { mapAdminError } from './admin-error.mapper'

const apiError = (code: string, status: number) => new ApiError({ code, message: code }, status)

describe('mapAdminError', () => {
  it('maps a missing 2FA', () => {
    expect(mapAdminError(apiError('TWO_FACTOR_REQUIRED', 403))).toBe('twoFactorRequired')
  })

  it('maps suspending your own account', () => {
    expect(mapAdminError(apiError('CANNOT_SUSPEND_SELF', 409))).toBe('cannotSuspendSelf')
  })

  it('maps any 404 to notFound', () => {
    expect(mapAdminError(apiError('USER_NOT_FOUND', 404))).toBe('notFound')
  })

  it('maps other API errors and non-API errors to unexpected', () => {
    expect(mapAdminError(apiError('VALIDATION_ERROR', 400))).toBe('unexpected')
    expect(mapAdminError(new Error('boom'))).toBe('unexpected')
  })
})

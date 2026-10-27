import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { mapCreateServerError } from './create-server-error.mapper'

describe('mapCreateServerError', () => {
  it('maps SERVER_LIMIT_REACHED to limitReached', () => {
    expect(mapCreateServerError(new ApiError({ code: 'SERVER_LIMIT_REACHED', message: 'x' }, 409))).toBe('limitReached')
  })

  it('maps any other API error to unexpected', () => {
    expect(mapCreateServerError(new ApiError({ code: 'VALIDATION_ERROR', message: 'x' }, 400))).toBe('unexpected')
  })

  it('maps a non-API error to unexpected', () => {
    expect(mapCreateServerError(new Error('boom'))).toBe('unexpected')
  })
})

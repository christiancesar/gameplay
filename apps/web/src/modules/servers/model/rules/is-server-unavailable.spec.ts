import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { isServerUnavailable } from './is-server-unavailable'

const apiError = (status?: number) => new ApiError({ code: 'X', message: 'x' }, status)

describe('isServerUnavailable', () => {
  it('is true for 403 and 404', () => {
    expect(isServerUnavailable(apiError(403))).toBe(true)
    expect(isServerUnavailable(apiError(404))).toBe(true)
  })

  it('is false for other failures', () => {
    expect(isServerUnavailable(apiError(500))).toBe(false)
    expect(isServerUnavailable(apiError())).toBe(false)
    expect(isServerUnavailable(new Error('boom'))).toBe(false)
    expect(isServerUnavailable(null)).toBe(false)
  })
})

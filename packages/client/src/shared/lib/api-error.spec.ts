import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, toApiError } from './api-error'

function axiosError(status?: number, data?: unknown) {
  const config = { headers: new AxiosHeaders() }
  const response = status ? { status, statusText: '', headers: {}, config, data } : undefined
  return new AxiosError('Request failed', 'ERR', config, undefined, response)
}

describe('toApiError', () => {
  it('reads the contract body', () => {
    const error = toApiError(
      axiosError(422, { error: { code: 'VALIDATION_FAILED', message: 'Invalid', fields: { name: ['too_short'] } } }),
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'VALIDATION_FAILED', status: 422, fields: { name: ['too_short'] } })
  })

  it('maps a request without response to NETWORK_ERROR', () => {
    expect(toApiError(axiosError())).toMatchObject({ code: 'NETWORK_ERROR', status: undefined })
  })

  it('keeps the status when the body is not the contract', () => {
    expect(toApiError(axiosError(502, '<html>'))).toMatchObject({ code: 'UNKNOWN_ERROR', status: 502 })
  })

  it('returns an ApiError as is', () => {
    const error = new ApiError({ code: 'NOT_FOUND', message: 'x' }, 404)
    expect(toApiError(error)).toBe(error)
  })
})

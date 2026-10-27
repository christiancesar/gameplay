import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { mapImageUploadError } from './image-upload-error.mapper'

const apiError = (code: string) => new ApiError({ code, message: code }, 400)

describe('mapImageUploadError', () => {
  it('maps the storage error codes', () => {
    expect(mapImageUploadError(apiError('IMAGE_TOO_LARGE'))).toBe('tooLarge')
    expect(mapImageUploadError(apiError('UNSUPPORTED_IMAGE'))).toBe('invalidType')
  })

  it('falls back to uploadFailed', () => {
    expect(mapImageUploadError(apiError('IMAGE_REQUIRED'))).toBe('uploadFailed')
    expect(mapImageUploadError(new Error('network'))).toBe('uploadFailed')
  })
})

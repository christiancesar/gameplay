import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { mapServerSettingsError } from './server-settings-error.mapper'

const apiError = (code: string) => new ApiError({ code, message: code }, 409)

describe('mapServerSettingsError', () => {
  it.each([
    ['MEMBER_LIMIT_REACHED', 'memberLimitReached'],
    ['ROOM_LIMIT_REACHED', 'roomLimitReached'],
    ['ROOM_NAME_TAKEN', 'roomNameTaken'],
    ['ROOM_NOT_FOUND', 'roomNotFound'],
    ['SERVER_PERMISSION_DENIED', 'permissionDenied'],
    ['JOIN_REQUEST_NOT_FOUND', 'requestGone'],
    ['JOIN_REQUEST_DECIDED', 'requestGone'],
    ['MEMBER_NOT_FOUND', 'memberNotFound'],
    ['SERVER_INVITE_NOT_FOUND', 'inviteNotFound'],
  ])('maps %s to %s', (code, key) => {
    expect(mapServerSettingsError(apiError(code))).toBe(key)
  })

  it('falls back to unexpected for unknown codes and non API errors', () => {
    expect(mapServerSettingsError(apiError('SOMETHING_ELSE'))).toBe('unexpected')
    expect(mapServerSettingsError(new Error('boom'))).toBe('unexpected')
  })
})

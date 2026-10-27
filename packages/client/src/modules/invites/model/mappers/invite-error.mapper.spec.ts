import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { mapInviteStatus, mapJoinInviteError } from './invite-error.mapper'

const apiError = (code: string, status: number) => new ApiError({ code, message: code }, status)

describe('mapInviteStatus', () => {
  it.each([
    ['active', undefined],
    ['expired', 'expired'],
    ['used', 'exhausted'],
    ['revoked', 'notFound'],
    ['not-found', 'notFound'],
  ] as const)('maps %s', (status, expected) => {
    expect(mapInviteStatus(status)).toBe(expected)
  })
})

describe('mapJoinInviteError', () => {
  it.each([
    ['SERVER_INVITE_EXPIRED', 410, 'expired'],
    ['SERVER_INVITE_USED', 409, 'exhausted'],
    ['JOIN_REQUEST_PENDING', 409, 'requestPending'],
    ['SERVER_INVITE_REVOKED', 410, 'notFound'],
    ['SERVER_INVITE_NOT_FOUND', 404, 'notFound'],
    ['SOMETHING_ELSE', 500, 'notFound'],
  ])('maps %s', (code, status, expected) => {
    expect(mapJoinInviteError(apiError(code, status))).toBe(expected)
  })

  it('falls back to notFound for a non API error', () => {
    expect(mapJoinInviteError(new Error('boom'))).toBe('notFound')
  })
})

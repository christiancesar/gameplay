import { describe, expect, it } from 'vitest'

import { joinRequest, olderJoinRequest } from '@/modules/servers/view-models/test/server-settings-seed'

import { toJoinRequestItems } from './settings-requests.mapper'

describe('toJoinRequestItems', () => {
  it('puts the oldest request first and uses the display name', () => {
    const items = toJoinRequestItems([joinRequest, olderJoinRequest])
    expect(items).toEqual([
      {
        id: 'jr0',
        user: { name: 'dani', username: 'dani', avatarUrl: undefined },
        requestedAt: olderJoinRequest.createdAt,
        invitedBy: 'bruna',
      },
      {
        id: 'jr1',
        user: { name: 'Carlos', username: 'carlos', avatarUrl: '/avatars/u5.webp' },
        requestedAt: joinRequest.createdAt,
        invitedBy: 'turbex',
      },
    ])
  })
})

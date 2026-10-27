import { describe, expect, it } from 'vitest'

import { settingsMembers } from '@/modules/servers/view-models/test/server-settings-seed'

import { toMemberItems } from './settings-members.mapper'

describe('toMemberItems', () => {
  it('orders by role and flags the current user', () => {
    const items = toMemberItems(settingsMembers, 'u3')
    expect(items.map((item) => [item.id, item.role, item.isMe])).toEqual([
      ['u1', 'owner', false],
      ['u3', 'admin', true],
      ['u2', 'member', false],
    ])
  })

  it('keeps the display name, avatar and how each one joined', () => {
    const [owner, admin, member] = toMemberItems(settingsMembers, undefined)
    expect(owner?.user).toEqual({ name: 'turbex', username: 'turbex', avatarUrl: '/avatars/u1.webp' })
    expect(owner?.joinedVia).toBeUndefined()
    expect(admin?.user.name).toBe('Bruna')
    expect(member?.joinedVia).toEqual({ invitedBy: 'bruna', joinedAt: '2026-01-02T00:00:00.000Z' })
  })
})

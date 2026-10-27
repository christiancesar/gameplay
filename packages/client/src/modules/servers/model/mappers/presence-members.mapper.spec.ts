import { describe, expect, it } from 'vitest'

import {
  adminMember,
  anaMember,
  carlosMember,
  members,
  ownerMember,
} from '@/modules/servers/view-models/test/server-screen-seed'

import { memberName, toPresenceMembers } from './presence-members.mapper'

describe('toPresenceMembers', () => {
  it('orders by role, then by name', () => {
    expect(toPresenceMembers(members, []).map((m) => m.id)).toEqual(['u1', 'u3', 'u2', 'u4'])
  })

  it('flags who is online and keeps avatar and role', () => {
    const result = toPresenceMembers(members, ['u1', 'u4'])
    expect(result.find((m) => m.id === 'u1')).toEqual({
      id: 'u1',
      name: 'turbex',
      avatarUrl: '/avatars/u1.webp',
      role: 'owner',
      isOnline: true,
    })
    expect(result.find((m) => m.id === 'u2')?.isOnline).toBe(false)
    expect(result.find((m) => m.id === 'u2')?.avatarUrl).toBeUndefined()
    expect(result.find((m) => m.id === 'u4')?.isOnline).toBe(true)
  })
})

describe('memberName', () => {
  it('prefers the display username', () => {
    expect(memberName({ ...anaMember, user: { ...anaMember.user, displayUsername: 'Ana B' } })).toBe('Ana B')
    expect(memberName(adminMember)).toBe('bruna')
    expect(memberName(carlosMember)).toBe('carlos')
    expect(memberName(ownerMember)).toBe('turbex')
  })
})

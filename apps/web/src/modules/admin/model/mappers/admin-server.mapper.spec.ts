import { describe, expect, it } from 'vitest'

import { toAdminServerItem, toAdminServerMember } from './admin-server.mapper'
import { adminServer, adminServerMember } from '../../view-models/test/admin-seed'

describe('toAdminServerItem', () => {
  it('maps counts against the effective limits', () => {
    expect(toAdminServerItem(adminServer)).toEqual({
      id: 'sv1',
      name: 'Turbex',
      iconUrl: undefined,
      ownerName: 'shinigame',
      members: { count: 6, limit: 10, isOverride: false },
      rooms: { count: 2, limit: 2, isOverride: false },
    })
  })

  it('marks a limit as override when the server has its own', () => {
    const item = toAdminServerItem({ ...adminServer, maxMembersOverride: 20, effectiveMaxMembers: 20 })
    expect(item.members).toEqual({ count: 6, limit: 20, isOverride: true })
    expect(item.rooms.isOverride).toBe(false)
  })

  it('treats a zero override as an override', () => {
    const item = toAdminServerItem({ ...adminServer, maxRoomsOverride: 0, effectiveMaxRooms: 0 })
    expect(item.rooms).toEqual({ count: 2, limit: 0, isOverride: true })
  })
})

describe('toAdminServerMember', () => {
  it('shows who created the invite the member used', () => {
    expect(toAdminServerMember(adminServerMember)).toEqual({
      id: 'u2',
      user: { name: 'Lua', username: 'lua', avatarUrl: undefined },
      role: 'member',
      joinedVia: { invitedBy: 'shinigame', joinedAt: adminServerMember.joinedAt },
    })
  })

  it('has no joinedVia for the owner', () => {
    expect(toAdminServerMember({ ...adminServerMember, role: 'owner', invite: null }).joinedVia).toBeUndefined()
  })
})

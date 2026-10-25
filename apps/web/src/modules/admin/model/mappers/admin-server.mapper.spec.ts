import { describe, expect, it } from 'vitest'

import { toAdminServerItem, toAdminServerMember } from './admin-server.mapper'
import { adminServer, adminServerMember } from '../../view-models/test/admin-seed'

const context = { defaultMembersLimit: 10, defaultRoomsLimit: 2 }

describe('toAdminServerItem', () => {
  it('maps counts against the global defaults', () => {
    expect(toAdminServerItem(adminServer, context)).toEqual({
      id: 'sv1',
      name: 'Turbex',
      iconUrl: undefined,
      ownerName: 'shinigame',
      members: { count: 6, limit: 10, isOverride: false },
      rooms: { count: 2, limit: 2, isOverride: false },
    })
  })

  it('uses the known override per limit', () => {
    const item = toAdminServerItem(adminServer, { ...context, override: { maxMembers: 20 } })
    expect(item.members).toEqual({ count: 6, limit: 20, isOverride: true })
    expect(item.rooms.isOverride).toBe(false)
  })

  it('treats a zero override as an override', () => {
    expect(toAdminServerItem(adminServer, { ...context, override: { maxRooms: 0 } }).rooms.limit).toBe(0)
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

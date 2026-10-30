import type { ServerRole } from '@gameplay/contracts'
import { type MemberAction, type ServerAction, ServerPermissions } from './server-permissions'

// plans/[complete]-core-product/00-requirements.md 2.3, row by row: [owner, admin, member].
const TABLE: [ServerAction, [boolean, boolean, boolean]][] = [
  ['decideJoinRequests', [true, true, false]],
  ['manageInvites', [true, true, false]],
  ['kickMember', [true, true, false]],
  ['kickAdmin', [true, true, false]],
  ['promoteMember', [true, true, false]],
  ['demoteAdmin', [true, true, false]],
  ['manageRooms', [true, true, false]],
  ['editServer', [true, true, false]],
  ['leaveServer', [false, true, true]],
  ['deleteServer', [true, false, false]],
  ['joinRooms', [true, true, true]],
]
const ROLES: ServerRole[] = ['owner', 'admin', 'member']

describe('ServerPermissions', () => {
  describe.each(TABLE)('%s', (action, expected) => {
    it.each(ROLES.map((role, i) => [role, expected[i]] as const))('%s: %s', (role, allowed) => {
      expect(ServerPermissions.can(role, action)).toBe(allowed)
    })
  })

  // [actor, target, action, allowed]
  it.each<[ServerRole, ServerRole, MemberAction, boolean]>([
    ['owner', 'admin', 'kick', true],
    ['owner', 'member', 'kick', true],
    ['admin', 'admin', 'kick', true],
    ['admin', 'member', 'kick', true],
    ['member', 'member', 'kick', false],
    ['owner', 'member', 'promote', true],
    ['admin', 'member', 'promote', true],
    ['admin', 'admin', 'promote', false],
    ['member', 'member', 'promote', false],
    ['owner', 'admin', 'demote', true],
    ['admin', 'admin', 'demote', true],
    ['admin', 'member', 'demote', false],
    ['member', 'admin', 'demote', false],
    // The owner is untouchable.
    ['admin', 'owner', 'kick', false],
    ['admin', 'owner', 'demote', false],
    ['owner', 'owner', 'kick', false],
    ['member', 'owner', 'kick', false],
  ])('%s -> %s %s: %s', (actor, target, action, allowed) => {
    expect(ServerPermissions.canActOn(actor, target, action)).toBe(allowed)
  })
})

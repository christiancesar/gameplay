import type { ServerRole } from '@gameplay/contracts'

// Mirror of the permission table in plans/00-requirements.md 2.3. Every
// module that acts inside a server (servers, memberships, realtime) asks here.
export type ServerAction =
  | 'decideJoinRequests'
  | 'manageInvites'
  | 'kickMember'
  | 'kickAdmin'
  | 'promoteMember'
  | 'demoteAdmin'
  | 'manageRooms'
  | 'editServer'
  | 'leaveServer'
  | 'deleteServer'
  | 'joinRooms'

const ALLOWED: Record<ServerAction, readonly ServerRole[]> = {
  decideJoinRequests: ['owner', 'admin'],
  manageInvites: ['owner', 'admin'],
  kickMember: ['owner', 'admin'],
  kickAdmin: ['owner', 'admin'],
  promoteMember: ['owner', 'admin'],
  demoteAdmin: ['owner', 'admin'],
  manageRooms: ['owner', 'admin'],
  editServer: ['owner', 'admin'],
  // The owner only leaves by deleting the server.
  leaveServer: ['admin', 'member'],
  deleteServer: ['owner'],
  joinRooms: ['owner', 'admin', 'member'],
}

export type MemberAction = 'kick' | 'promote' | 'demote'

export const ServerPermissions = {
  can(role: ServerRole, action: ServerAction): boolean {
    return ALLOWED[action].includes(role)
  },

  // Acting on another member. The owner is untouchable: nobody kicks or
  // demotes them. Promote only applies to members, demote only to admins.
  canActOn(actor: ServerRole, target: ServerRole, action: MemberAction): boolean {
    if (target === 'owner') return false
    switch (action) {
      case 'kick':
        return ServerPermissions.can(actor, target === 'admin' ? 'kickAdmin' : 'kickMember')
      case 'promote':
        return target === 'member' && ServerPermissions.can(actor, 'promoteMember')
      case 'demote':
        return target === 'admin' && ServerPermissions.can(actor, 'demoteAdmin')
    }
  },
}

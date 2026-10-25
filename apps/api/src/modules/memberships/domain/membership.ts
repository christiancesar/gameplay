import type { ServerInviteStatus, ServerRole, UserRef } from '@gameplay/contracts'

export type InviteRecord = {
  id: string
  serverId: string
  code: string
  createdById: string
  createdAt: Date
  expiresAt: Date
  revokedAt: Date | null
  usedById: string | null
  usedAt: Date | null
}

// The invite with the people it points to, for the lists.
export type InviteListItem = InviteRecord & { createdBy: UserRef; usedBy: UserRef | null }

export type JoinStatus = 'pending' | 'approved' | 'declined'

export type JoinRequestRecord = {
  id: string
  serverId: string
  userId: string
  inviteId: string
  status: JoinStatus
  createdAt: Date
}

export type MemberUser = UserRef & { displayUsername: string | null; image: string | null }

export type JoinRequestListItem = JoinRequestRecord & { user: MemberUser; invitedBy: UserRef }

export type MemberListItem = {
  user: MemberUser
  role: ServerRole
  joinedAt: Date
  invite: { id: string; createdBy: UserRef } | null
}

export const SERVER_INVITE_TTL_MS = 60 * 60 * 1000

// Revoked and used win over expired: they say what happened to the invite.
export function serverInviteStatus(invite: InviteRecord, now: Date): ServerInviteStatus {
  if (invite.revokedAt) return 'revoked'
  if (invite.usedAt) return 'used'
  if (invite.expiresAt.getTime() <= now.getTime()) return 'expired'
  return 'active'
}

import type { ServerRole } from '@gameplay/contracts'
import type {
  InviteListItem,
  InviteRecord,
  JoinRequestListItem,
  JoinRequestRecord,
  JoinStatus,
  MemberListItem,
} from '../domain/membership'

export type CreateInviteData = { serverId: string; code: string; createdById: string; expiresAt: Date }
export type CreateRequestData = {
  serverId: string
  userId: string
  inviteId: string
  status: JoinStatus
  decidedById: string | null
  decidedAt: Date | null
}

// Reads and writes inside withServerLock: everything that counts members or
// checks for a pending request goes through here, one server at a time.
export interface MembershipStore {
  countMembers(serverId: string): Promise<number>
  findRole(serverId: string, userId: string): Promise<ServerRole | null>
  addMember(data: { serverId: string; userId: string; role: ServerRole; inviteId: string | null }): Promise<void>
  removeMember(serverId: string, userId: string): Promise<void>
  setRole(serverId: string, userId: string, role: ServerRole): Promise<void>

  createInvite(data: CreateInviteData): Promise<InviteListItem>
  findInvite(inviteId: string): Promise<InviteRecord | null>
  revokeInvite(inviteId: string, now: Date): Promise<void>
  markInviteUsed(inviteId: string, userId: string, now: Date): Promise<void>

  hasPendingRequest(serverId: string, userId: string): Promise<boolean>
  findRequest(requestId: string): Promise<JoinRequestRecord | null>
  createRequest(data: CreateRequestData): Promise<JoinRequestRecord>
  decideRequest(requestId: string, status: JoinStatus, decidedById: string, now: Date): Promise<void>
}

export abstract class MembershipsRepository {
  // Runs `work` in a transaction holding the server's row lock.
  abstract withServerLock<T>(serverId: string, work: (store: MembershipStore) => Promise<T>): Promise<T>

  abstract findInviteByCode(code: string): Promise<InviteRecord | null>
  // Newest first.
  abstract listInvites(serverId: string): Promise<InviteListItem[]>
  // Pending only, oldest first.
  abstract listPendingRequests(serverId: string): Promise<JoinRequestListItem[]>
  // Owner first, then by join date.
  abstract listMembers(serverId: string): Promise<MemberListItem[]>
}

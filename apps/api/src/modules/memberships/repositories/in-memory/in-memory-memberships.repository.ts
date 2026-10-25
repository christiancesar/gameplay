import type { ServerRole } from '@gameplay/shared'
import type { InMemoryServersRepository } from '../../../servers/repositories/in-memory/in-memory-servers.repository'
import type {
  InviteListItem,
  InviteRecord,
  JoinRequestListItem,
  JoinRequestRecord,
  JoinStatus,
  MemberListItem,
  MemberUser,
} from '../../domain/membership'
import {
  type CreateInviteData,
  type CreateRequestData,
  type MembershipStore,
  MembershipsRepository,
} from '../memberships.repository'

type StoredRequest = JoinRequestRecord & { decidedById: string | null; decidedAt: Date | null }

// Shares the members list of the in-memory servers repository, so the
// servers module's access checks see the same members.
export class InMemoryMembershipsRepository extends MembershipsRepository implements MembershipStore {
  readonly invites: InviteRecord[] = []
  readonly requests: StoredRequest[] = []
  // inviteId per member, keyed by "serverId:userId".
  readonly memberInvites = new Map<string, string | null>()
  readonly users = new Map<string, MemberUser>()
  private sequence = 0

  constructor(private readonly servers: InMemoryServersRepository) {
    super()
  }

  withServerLock<T>(_serverId: string, work: (store: MembershipStore) => Promise<T>): Promise<T> {
    return work(this)
  }

  async countMembers(serverId: string): Promise<number> {
    return this.servers.members.filter((member) => member.serverId === serverId).length
  }

  async findRole(serverId: string, userId: string): Promise<ServerRole | null> {
    return this.member(serverId, userId)?.role ?? null
  }

  async addMember({ serverId, userId, role, inviteId }: Parameters<MembershipStore['addMember']>[0]): Promise<void> {
    this.servers.addMember(serverId, userId, role)
    this.memberInvites.set(`${serverId}:${userId}`, inviteId)
  }

  async removeMember(serverId: string, userId: string): Promise<void> {
    const index = this.servers.members.findIndex((m) => m.serverId === serverId && m.userId === userId)
    if (index >= 0) this.servers.members.splice(index, 1)
  }

  async setRole(serverId: string, userId: string, role: ServerRole): Promise<void> {
    const member = this.member(serverId, userId)
    if (member) member.role = role
  }

  async createInvite(data: CreateInviteData): Promise<InviteListItem> {
    this.sequence += 1
    const invite: InviteRecord = {
      id: `invite-${this.sequence}`,
      ...data,
      createdAt: new Date(),
      revokedAt: null,
      usedById: null,
      usedAt: null,
    }
    this.invites.push(invite)
    return this.toListItem(invite)
  }

  async findInvite(inviteId: string): Promise<InviteRecord | null> {
    const invite = this.invites.find((i) => i.id === inviteId)
    return invite ? { ...invite } : null
  }

  async revokeInvite(inviteId: string, now: Date): Promise<void> {
    const invite = this.invites.find((i) => i.id === inviteId)
    if (invite) invite.revokedAt ??= now
  }

  async markInviteUsed(inviteId: string, userId: string, now: Date): Promise<void> {
    const invite = this.invites.find((i) => i.id === inviteId)
    if (invite) Object.assign(invite, { usedById: userId, usedAt: now })
  }

  async hasPendingRequest(serverId: string, userId: string): Promise<boolean> {
    return this.requests.some((r) => r.serverId === serverId && r.userId === userId && r.status === 'pending')
  }

  async findRequest(requestId: string): Promise<JoinRequestRecord | null> {
    const request = this.requests.find((r) => r.id === requestId)
    return request ? { ...request } : null
  }

  async createRequest(data: CreateRequestData): Promise<JoinRequestRecord> {
    this.sequence += 1
    const request: StoredRequest = { id: `request-${this.sequence}`, createdAt: new Date(), ...data }
    this.requests.push(request)
    return { ...request }
  }

  async decideRequest(requestId: string, status: JoinStatus, decidedById: string, now: Date): Promise<void> {
    const request = this.requests.find((r) => r.id === requestId)
    if (request) Object.assign(request, { status, decidedById, decidedAt: now })
  }

  async findInviteByCode(code: string): Promise<InviteRecord | null> {
    const invite = this.invites.find((i) => i.code === code)
    return invite ? { ...invite } : null
  }

  async listInvites(serverId: string): Promise<InviteListItem[]> {
    return this.invites
      .filter((invite) => invite.serverId === serverId)
      .reverse()
      .map((invite) => this.toListItem(invite))
  }

  async listPendingRequests(serverId: string): Promise<JoinRequestListItem[]> {
    return this.requests
      .filter((r) => r.serverId === serverId && r.status === 'pending')
      .map((r) => {
        const invite = this.invites.find((i) => i.id === r.inviteId)!
        return { ...r, user: this.user(r.userId), invitedBy: this.ref(invite.createdById) }
      })
  }

  async listMembers(serverId: string): Promise<MemberListItem[]> {
    return this.servers.members
      .filter((member) => member.serverId === serverId)
      .sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'))
      .map((member) => {
        const inviteId = this.memberInvites.get(`${serverId}:${member.userId}`) ?? null
        const invite = inviteId ? this.invites.find((i) => i.id === inviteId) : undefined
        return {
          user: this.user(member.userId),
          role: member.role,
          joinedAt: member.joinedAt,
          invite: invite ? { id: invite.id, createdBy: this.ref(invite.createdById) } : null,
        }
      })
  }

  private member(serverId: string, userId: string) {
    return this.servers.members.find((m) => m.serverId === serverId && m.userId === userId)
  }

  private user(id: string): MemberUser {
    return this.users.get(id) ?? { id, username: id, displayUsername: null, image: null }
  }

  private ref(id: string) {
    const { username } = this.user(id)
    return { id, username }
  }

  private toListItem(invite: InviteRecord): InviteListItem {
    return {
      ...invite,
      createdBy: this.ref(invite.createdById),
      usedBy: invite.usedById ? this.ref(invite.usedById) : null,
    }
  }
}

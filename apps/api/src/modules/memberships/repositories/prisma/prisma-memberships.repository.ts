import { Injectable } from '@nestjs/common'
import type { ServerRole } from '@gameplay/contracts'
import type { Prisma } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import { toRole } from '../../../servers/repositories/prisma/prisma-servers.repository'
import type {
  InviteListItem,
  InviteRecord,
  JoinRequestListItem,
  JoinRequestRecord,
  JoinStatus,
  MemberListItem,
} from '../../domain/membership'
import {
  type CreateInviteData,
  type CreateRequestData,
  type MembershipStore,
  MembershipsRepository,
} from '../memberships.repository'

type Client = Prisma.TransactionClient

const userRef = { select: { id: true, username: true } } as const
const memberUser = { select: { id: true, username: true, displayUsername: true, image: true } } as const
const inviteListSelect = {
  id: true,
  serverId: true,
  code: true,
  createdById: true,
  createdAt: true,
  expiresAt: true,
  revokedAt: true,
  usedById: true,
  usedAt: true,
  createdBy: userRef,
  usedBy: userRef,
} satisfies Prisma.ServerInviteSelect
const requestSelect = {
  id: true,
  serverId: true,
  userId: true,
  inviteId: true,
  status: true,
  createdAt: true,
} satisfies Prisma.JoinRequestSelect

type Named = { id: string; username: string | null }

// The username is optional in the Better Auth table; sign-up always sets it.
function ref(user: Named) {
  return { id: user.id, username: user.username ?? '' }
}

function toInviteListItem({
  createdBy,
  usedBy,
  ...invite
}: Prisma.ServerInviteGetPayload<{ select: typeof inviteListSelect }>): InviteListItem {
  return { ...invite, createdBy: ref(createdBy), usedBy: usedBy && ref(usedBy) }
}

function toRequest(row: Prisma.JoinRequestGetPayload<{ select: typeof requestSelect }>): JoinRequestRecord {
  return { ...row, status: row.status.toLowerCase() as JoinStatus }
}

const toDbRole = (role: ServerRole) => role.toUpperCase() as 'OWNER' | 'ADMIN' | 'MEMBER'
const toDbStatus = (status: JoinStatus) => status.toUpperCase() as 'PENDING' | 'APPROVED' | 'DECLINED'

class PrismaMembershipStore implements MembershipStore {
  constructor(private readonly db: Client) {}

  countMembers(serverId: string): Promise<number> {
    return this.db.serverMember.count({ where: { serverId } })
  }

  async findRole(serverId: string, userId: string): Promise<ServerRole | null> {
    const member = await this.db.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
      select: { role: true },
    })
    return member && toRole(member.role)
  }

  async addMember({ serverId, userId, role, inviteId }: Parameters<MembershipStore['addMember']>[0]) {
    await this.db.serverMember.create({ data: { serverId, userId, role: toDbRole(role), inviteId } })
  }

  async removeMember(serverId: string, userId: string) {
    await this.db.serverMember.deleteMany({ where: { serverId, userId } })
  }

  async setRole(serverId: string, userId: string, role: ServerRole) {
    await this.db.serverMember.update({
      where: { serverId_userId: { serverId, userId } },
      data: { role: toDbRole(role) },
    })
  }

  async createInvite(data: CreateInviteData): Promise<InviteListItem> {
    return toInviteListItem(await this.db.serverInvite.create({ data, select: inviteListSelect }))
  }

  findInvite(inviteId: string): Promise<InviteRecord | null> {
    return findInvite(this.db, { id: inviteId })
  }

  async revokeInvite(inviteId: string, now: Date) {
    await this.db.serverInvite.updateMany({ where: { id: inviteId, revokedAt: null }, data: { revokedAt: now } })
  }

  async markInviteUsed(inviteId: string, userId: string, now: Date) {
    await this.db.serverInvite.update({ where: { id: inviteId }, data: { usedById: userId, usedAt: now } })
  }

  async hasPendingRequest(serverId: string, userId: string): Promise<boolean> {
    return (await this.db.joinRequest.count({ where: { serverId, userId, status: 'PENDING' } })) > 0
  }

  async findRequest(requestId: string): Promise<JoinRequestRecord | null> {
    const row = await this.db.joinRequest.findUnique({ where: { id: requestId }, select: requestSelect })
    return row && toRequest(row)
  }

  async createRequest({ status, ...data }: CreateRequestData): Promise<JoinRequestRecord> {
    return toRequest(
      await this.db.joinRequest.create({ data: { ...data, status: toDbStatus(status) }, select: requestSelect }),
    )
  }

  async decideRequest(requestId: string, status: JoinStatus, decidedById: string, now: Date) {
    await this.db.joinRequest.update({
      where: { id: requestId },
      data: { status: toDbStatus(status), decidedById, decidedAt: now },
    })
  }
}

function findInvite(db: Client, where: Prisma.ServerInviteWhereUniqueInput): Promise<InviteRecord | null> {
  return db.serverInvite.findUnique({
    where,
    select: {
      id: true,
      serverId: true,
      code: true,
      createdById: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
      usedById: true,
      usedAt: true,
    },
  })
}

@Injectable()
export class PrismaMembershipsRepository extends MembershipsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  withServerLock<T>(serverId: string, work: (store: MembershipStore) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "server" WHERE id = ${serverId} FOR UPDATE`
      return work(new PrismaMembershipStore(tx))
    })
  }

  findInviteByCode(code: string): Promise<InviteRecord | null> {
    return findInvite(this.prisma, { code })
  }

  async listInvites(serverId: string): Promise<InviteListItem[]> {
    const rows = await this.prisma.serverInvite.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' },
      select: inviteListSelect,
    })
    return rows.map(toInviteListItem)
  }

  async listPendingRequests(serverId: string): Promise<JoinRequestListItem[]> {
    const rows = await this.prisma.joinRequest.findMany({
      where: { serverId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: { ...requestSelect, user: memberUser, invite: { select: { createdBy: userRef } } },
    })
    return rows.map(({ user, invite, ...row }) => ({
      ...toRequest(row),
      user: { ...user, username: user.username ?? '' },
      invitedBy: ref(invite.createdBy),
    }))
  }

  async listMembers(serverId: string): Promise<MemberListItem[]> {
    const rows = await this.prisma.serverMember.findMany({
      where: { serverId },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      select: {
        role: true,
        joinedAt: true,
        user: memberUser,
        invite: { select: { id: true, createdBy: userRef } },
      },
    })
    // Enum order in Postgres is the declaration order: OWNER, ADMIN, MEMBER.
    return rows.map(({ user, role, joinedAt, invite }) => ({
      user: { ...user, username: user.username ?? '' },
      role: toRole(role),
      joinedAt,
      invite: invite && { id: invite.id, createdBy: ref(invite.createdBy) },
    }))
  }
}

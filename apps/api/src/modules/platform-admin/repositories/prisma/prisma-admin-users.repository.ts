import { Injectable } from '@nestjs/common'
import type { Prisma } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { AdminUserRecord, Page, PageQuery } from '../../domain/admin-records'
import { AdminUsersRepository } from '../admin-users.repository'

const select = {
  id: true,
  username: true,
  displayUsername: true,
  email: true,
  image: true,
  role: true,
  banned: true,
  twoFactorEnabled: true,
  maxServersOverride: true,
  createdAt: true,
} as const

type Row = Prisma.UserGetPayload<{ select: typeof select }>

function toRecord(row: Row, ownedServerCount: number, sessionCount: number): AdminUserRecord {
  return {
    id: row.id,
    // Every account has one (the username plugin requires it on sign-up).
    username: row.username ?? '',
    displayUsername: row.displayUsername,
    email: row.email,
    image: row.image,
    role: row.role === 'admin' ? 'admin' : 'user',
    suspended: row.banned === true,
    twoFactorEnabled: row.twoFactorEnabled === true,
    maxServersOverride: row.maxServersOverride,
    ownedServerCount,
    sessionCount,
    createdAt: row.createdAt,
  }
}

@Injectable()
export class PrismaAdminUsersRepository extends AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async list({ search, page, pageSize }: PageQuery): Promise<Page<AdminUserRecord>> {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ])
    const ids = rows.map(({ id }) => id)
    const [owned, sessions] = await this.counts(ids)
    return { items: rows.map((row) => toRecord(row, owned.get(row.id) ?? 0, sessions.get(row.id) ?? 0)), total }
  }

  async findById(userId: string): Promise<AdminUserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { id: userId }, select })
    if (!row) return null
    const [owned, sessions] = await this.counts([userId])
    return toRecord(row, owned.get(userId) ?? 0, sessions.get(userId) ?? 0)
  }

  // Servers owned and active sessions of each user, two group-bys for the page.
  private async counts(userIds: string[]): Promise<[Map<string, number>, Map<string, number>]> {
    const [owned, sessions] = await Promise.all([
      this.prisma.server.groupBy({ by: ['ownerId'], where: { ownerId: { in: userIds } }, _count: { _all: true } }),
      this.prisma.session.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, expiresAt: { gt: new Date() } },
        _count: { _all: true },
      }),
    ])
    return [
      new Map(owned.map((row) => [row.ownerId, row._count._all])),
      new Map(sessions.map((row) => [row.userId, row._count._all])),
    ]
  }
}

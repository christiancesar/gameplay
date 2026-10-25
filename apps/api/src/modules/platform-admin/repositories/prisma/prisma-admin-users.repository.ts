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
  createdAt: true,
} as const

type Row = Prisma.UserGetPayload<{ select: typeof select }>

function toRecord(row: Row): AdminUserRecord {
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
    return { items: rows.map(toRecord), total }
  }

  async findById(userId: string): Promise<AdminUserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { id: userId }, select })
    return row ? toRecord(row) : null
  }
}

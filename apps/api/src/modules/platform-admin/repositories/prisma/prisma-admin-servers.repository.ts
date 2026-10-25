import { Injectable } from '@nestjs/common'
import type { Prisma } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { AdminServerRecord, Page, PageQuery } from '../../domain/admin-records'
import { AdminServersRepository } from '../admin-servers.repository'

const select = {
  id: true,
  name: true,
  iconKey: true,
  createdAt: true,
  maxMembersOverride: true,
  maxRoomsOverride: true,
  owner: { select: { id: true, username: true } },
  _count: { select: { members: true, rooms: true } },
} as const

type Row = Prisma.ServerGetPayload<{ select: typeof select }>

function toRecord(row: Row): AdminServerRecord {
  return {
    id: row.id,
    name: row.name,
    iconKey: row.iconKey,
    owner: { id: row.owner.id, username: row.owner.username ?? '' },
    memberCount: row._count.members,
    roomCount: row._count.rooms,
    maxMembersOverride: row.maxMembersOverride,
    maxRoomsOverride: row.maxRoomsOverride,
    createdAt: row.createdAt,
  }
}

@Injectable()
export class PrismaAdminServersRepository extends AdminServersRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async list({ search, page, pageSize }: PageQuery): Promise<Page<AdminServerRecord>> {
    const where: Prisma.ServerWhereInput = search ? { name: { contains: search, mode: 'insensitive' } } : {}
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.server.findMany({
        where,
        select,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.server.count({ where }),
    ])
    return { items: rows.map(toRecord), total }
  }

  async findById(serverId: string): Promise<AdminServerRecord | null> {
    const row = await this.prisma.server.findUnique({ where: { id: serverId }, select })
    return row ? toRecord(row) : null
  }
}

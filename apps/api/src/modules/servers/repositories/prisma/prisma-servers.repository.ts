import { Injectable } from '@nestjs/common'
import type { ServerRole } from '@gameplay/contracts'
import type { ServerRole as DbServerRole } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { RoomRecord, ServerRecord, ServerWithRole } from '../../domain/server'
import { type CreateServerData, type ServerChanges, ServersRepository } from '../servers.repository'

const serverSelect = {
  id: true,
  name: true,
  description: true,
  iconKey: true,
  coverKey: true,
  autoApprove: true,
  ownerId: true,
  createdAt: true,
} as const

const roomSelect = { id: true, serverId: true, name: true, position: true } as const

export function toRole(role: DbServerRole): ServerRole {
  return role.toLowerCase() as ServerRole
}

@Injectable()
export class PrismaServersRepository extends ServersRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  createWithOwner(
    { name, description, ownerId, roomName }: CreateServerData,
    guard: (ownedCount: number) => void,
  ): Promise<{ server: ServerRecord; room: RoomRecord }> {
    return this.prisma.$transaction(async (tx) => {
      // Two creations at once by the same user wait here, so the count holds.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${ownerId} FOR UPDATE`
      guard(await tx.server.count({ where: { ownerId } }))

      const { rooms, ...server } = await tx.server.create({
        data: {
          name,
          description,
          ownerId,
          members: { create: { userId: ownerId, role: 'OWNER' } },
          rooms: { create: { name: roomName, position: 0 } },
        },
        select: { ...serverSelect, rooms: { select: roomSelect } },
      })
      return { server, room: rooms[0] }
    })
  }

  findById(serverId: string): Promise<ServerRecord | null> {
    return this.prisma.server.findUnique({ where: { id: serverId }, select: serverSelect })
  }

  async findRole(serverId: string, userId: string): Promise<ServerWithRole | null> {
    const member = await this.prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
      select: { role: true, server: { select: serverSelect } },
    })
    return member && { server: member.server, role: toRole(member.role) }
  }

  async listForUser(userId: string): Promise<ServerWithRole[]> {
    const members = await this.prisma.serverMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
      select: { role: true, server: { select: serverSelect } },
    })
    return members.map((member) => ({ server: member.server, role: toRole(member.role) }))
  }

  update(serverId: string, changes: ServerChanges): Promise<ServerRecord> {
    return this.prisma.server.update({ where: { id: serverId }, data: changes, select: serverSelect })
  }

  countMembers(serverId: string): Promise<number> {
    return this.prisma.serverMember.count({ where: { serverId } })
  }

  async listMemberIds(serverId: string): Promise<string[]> {
    const members = await this.prisma.serverMember.findMany({ where: { serverId }, select: { userId: true } })
    return members.map((member) => member.userId)
  }

  async delete(serverId: string): Promise<void> {
    await this.prisma.server.deleteMany({ where: { id: serverId } })
  }
}

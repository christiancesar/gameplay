import { Injectable } from '@nestjs/common'
import type { ServerLimits } from '@gameplay/shared'
import { PrismaService } from '../../../../lib/prisma'
import { ServerLimitsRepository } from '../server-limits.repository'

@Injectable()
export class PrismaServerLimitsRepository extends ServerLimitsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async find(serverId: string): Promise<ServerLimits | null> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { maxMembersOverride: true, maxRoomsOverride: true },
    })
    return server && { maxMembers: server.maxMembersOverride, maxRooms: server.maxRoomsOverride }
  }

  async set(serverId: string, { maxMembers, maxRooms }: ServerLimits): Promise<boolean> {
    const { count } = await this.prisma.server.updateMany({
      where: { id: serverId },
      data: { maxMembersOverride: maxMembers, maxRoomsOverride: maxRooms },
    })
    return count === 1
  }
}

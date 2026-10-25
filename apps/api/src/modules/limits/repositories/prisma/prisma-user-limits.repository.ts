import { Injectable } from '@nestjs/common'
import type { UserLimits } from '@gameplay/contracts'
import { PrismaService } from '../../../../lib/prisma'
import { UserLimitsRepository } from '../user-limits.repository'

@Injectable()
export class PrismaUserLimitsRepository extends UserLimitsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async find(userId: string): Promise<UserLimits | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { maxServersOverride: true } })
    return user && { maxServers: user.maxServersOverride }
  }

  async set(userId: string, { maxServers }: UserLimits): Promise<boolean> {
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId },
      data: { maxServersOverride: maxServers },
    })
    return count === 1
  }
}

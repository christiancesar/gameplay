import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../lib/prisma'
import { MediaUsageRepository } from '../media-usage.repository'

@Injectable()
export class PrismaMediaUsageRepository extends MediaUsageRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  // One atomic increment per report, so concurrent viewers never lose bytes.
  async addSfuBytes(month: string, bytes: number): Promise<void> {
    await this.prisma.mediaUsage.upsert({
      where: { month },
      create: { month, sfuBytes: BigInt(bytes) },
      update: { sfuBytes: { increment: BigInt(bytes) } },
    })
  }

  async sfuBytes(month: string): Promise<number> {
    const row = await this.prisma.mediaUsage.findUnique({ where: { month }, select: { sfuBytes: true } })
    return Number(row?.sfuBytes ?? 0n)
  }
}

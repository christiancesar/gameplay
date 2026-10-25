import { Injectable } from '@nestjs/common'
import type { CollectedHardware } from '@gameplay/contracts'
import { PrismaService } from '../../../../lib/prisma'
import { AdminDevicesRepository } from '../admin-devices.repository'

@Injectable()
export class PrismaAdminDevicesRepository extends AdminDevicesRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  // The JSON column only ever receives values that passed the shared schema.
  async listCollected(): Promise<CollectedHardware[]> {
    const rows = await this.prisma.deviceReport.findMany({ select: { collected: true } })
    return rows.map((row) => row.collected as CollectedHardware)
  }
}

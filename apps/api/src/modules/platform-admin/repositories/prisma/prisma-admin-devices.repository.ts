import { Injectable } from '@nestjs/common'
import type { CollectedHardware, ManualHardware } from '@gameplay/contracts'
import type { Prisma } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { AdminDeviceRecord, Page, PageQuery } from '../../domain/admin-records'
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

  async list({ search, page, pageSize }: PageQuery): Promise<Page<AdminDeviceRecord>> {
    const where: Prisma.DeviceReportWhereInput = search
      ? { user: { username: { contains: search, mode: 'insensitive' } } }
      : {}
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.deviceReport.findMany({
        where,
        select: {
          deviceId: true,
          collected: true,
          manual: true,
          collectedAt: true,
          user: { select: { id: true, username: true } },
        },
        orderBy: [{ collectedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deviceReport.count({ where }),
    ])
    return {
      items: rows.map((row) => ({
        user: { id: row.user.id, username: row.user.username ?? '' },
        deviceId: row.deviceId,
        collected: row.collected as CollectedHardware,
        manual: row.manual as ManualHardware | null,
        collectedAt: row.collectedAt,
      })),
      total,
    }
  }
}

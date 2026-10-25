import { Injectable } from '@nestjs/common'
import { type CollectedHardware, type ManualHardware } from '@gameplay/shared'
import type { DeviceReport as Row } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { DeviceReportRecord } from '../../domain/account'
import { type CollectionData, DeviceReportsRepository } from '../device-reports.repository'

// The JSON columns only ever receive values that passed the shared schemas.
function toRecord(row: Row): DeviceReportRecord {
  return {
    id: row.id,
    userId: row.userId,
    deviceId: row.deviceId,
    collected: row.collected as CollectedHardware,
    manual: row.manual as ManualHardware | null,
    collectedAt: row.collectedAt,
  }
}

@Injectable()
export class PrismaDeviceReportsRepository extends DeviceReportsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async upsertCollected({ userId, deviceId, collected, collectedAt }: CollectionData): Promise<DeviceReportRecord> {
    const row = await this.prisma.deviceReport.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: { userId, deviceId, collected, collectedAt },
      update: { collected, collectedAt },
    })
    return toRecord(row)
  }

  async setManual(userId: string, deviceId: string, manual: ManualHardware): Promise<DeviceReportRecord | null> {
    const { count } = await this.prisma.deviceReport.updateMany({ where: { userId, deviceId }, data: { manual } })
    if (count === 0) return null
    const row = await this.prisma.deviceReport.findUniqueOrThrow({ where: { userId_deviceId: { userId, deviceId } } })
    return toRecord(row)
  }

  async listByUser(userId: string): Promise<DeviceReportRecord[]> {
    const rows = await this.prisma.deviceReport.findMany({ where: { userId }, orderBy: { collectedAt: 'desc' } })
    return rows.map(toRecord)
  }
}

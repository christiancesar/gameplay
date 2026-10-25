import type { ManualHardware } from '@gameplay/contracts'
import type { DeviceReportRecord } from '../../domain/account'
import { type CollectionData, DeviceReportsRepository } from '../device-reports.repository'

export class InMemoryDeviceReportsRepository extends DeviceReportsRepository {
  readonly reports: DeviceReportRecord[] = []
  private sequence = 0

  async upsertCollected({ userId, deviceId, collected, collectedAt }: CollectionData): Promise<DeviceReportRecord> {
    const existing = this.find(userId, deviceId)
    if (existing) {
      Object.assign(existing, { collected, collectedAt })
      return { ...existing }
    }
    this.sequence += 1
    const report: DeviceReportRecord = {
      id: `device-${this.sequence}`,
      userId,
      deviceId,
      collected,
      manual: null,
      collectedAt,
    }
    this.reports.push(report)
    return { ...report }
  }

  async setManual(userId: string, deviceId: string, manual: ManualHardware): Promise<DeviceReportRecord | null> {
    const existing = this.find(userId, deviceId)
    if (!existing) return null
    existing.manual = manual
    return { ...existing }
  }

  async listByUser(userId: string): Promise<DeviceReportRecord[]> {
    return this.reports
      .filter((report) => report.userId === userId)
      .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())
      .map((report) => ({ ...report }))
  }

  private find(userId: string, deviceId: string) {
    return this.reports.find((report) => report.userId === userId && report.deviceId === deviceId)
  }
}

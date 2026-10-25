import type { CollectedHardware, ManualHardware } from '@gameplay/contracts'
import type { DeviceReportRecord } from '../domain/account'

export type CollectionData = {
  userId: string
  deviceId: string
  collected: CollectedHardware
  collectedAt: Date
}

export abstract class DeviceReportsRepository {
  // Creates the device's report or replaces its collected part; manual stays.
  abstract upsertCollected(data: CollectionData): Promise<DeviceReportRecord>
  // null when the user has no report for that device.
  abstract setManual(userId: string, deviceId: string, manual: ManualHardware): Promise<DeviceReportRecord | null>
  // Most recently collected first.
  abstract listByUser(userId: string): Promise<DeviceReportRecord[]>
}

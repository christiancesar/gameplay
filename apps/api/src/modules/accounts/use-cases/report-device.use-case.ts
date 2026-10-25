import { Injectable } from '@nestjs/common'
import type { CollectedHardware } from '@gameplay/shared'
import type { DeviceReportRecord } from '../domain/account'
import { DeviceReportsRepository } from '../repositories/device-reports.repository'

type Input = { userId: string; deviceId: string; collected: CollectedHardware }

// Sent by the web on sign-in and on "collect again". One report per device;
// a new collection replaces the collected part and keeps the manual one.
@Injectable()
export class ReportDeviceUseCase {
  constructor(private readonly devices: DeviceReportsRepository) {}

  execute({ userId, deviceId, collected }: Input): Promise<DeviceReportRecord> {
    return this.devices.upsertCollected({ userId, deviceId, collected, collectedAt: new Date() })
  }
}

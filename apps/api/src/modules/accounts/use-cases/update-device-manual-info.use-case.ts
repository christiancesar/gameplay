import { Injectable } from '@nestjs/common'
import type { ManualHardware } from '@gameplay/shared'
import type { DeviceReportRecord } from '../domain/account'
import { DeviceNotFoundError } from '../errors/accounts.errors'
import { DeviceReportsRepository } from '../repositories/device-reports.repository'

type Input = { userId: string; deviceId: string; manual: ManualHardware }

// Replaces what the user typed in for that device.
@Injectable()
export class UpdateDeviceManualInfoUseCase {
  constructor(private readonly devices: DeviceReportsRepository) {}

  async execute({ userId, deviceId, manual }: Input): Promise<DeviceReportRecord> {
    const report = await this.devices.setManual(userId, deviceId, manual)
    if (!report) throw new DeviceNotFoundError()
    return report
  }
}

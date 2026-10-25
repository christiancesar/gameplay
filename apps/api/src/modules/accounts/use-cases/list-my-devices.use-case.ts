import { Injectable } from '@nestjs/common'
import type { DeviceReportRecord } from '../domain/account'
import { DeviceReportsRepository } from '../repositories/device-reports.repository'

@Injectable()
export class ListMyDevicesUseCase {
  constructor(private readonly devices: DeviceReportsRepository) {}

  execute(userId: string): Promise<DeviceReportRecord[]> {
    return this.devices.listByUser(userId)
  }
}

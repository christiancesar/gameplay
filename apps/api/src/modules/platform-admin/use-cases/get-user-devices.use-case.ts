import { Injectable } from '@nestjs/common'
import type { DeviceReportRecord } from '../../accounts/domain/account'
import { DeviceReportsRepository } from '../../accounts/repositories/device-reports.repository'
import { AdminUsersService } from '../services/admin-users.service'

@Injectable()
export class GetUserDevicesUseCase {
  constructor(
    private readonly users: AdminUsersService,
    private readonly devices: DeviceReportsRepository,
  ) {}

  async execute(userId: string): Promise<DeviceReportRecord[]> {
    await this.users.require(userId)
    return this.devices.listByUser(userId)
  }
}

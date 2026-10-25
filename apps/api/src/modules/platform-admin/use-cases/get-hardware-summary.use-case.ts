import { Injectable } from '@nestjs/common'
import type { HardwareSummary } from '@gameplay/contracts'
import { summarizeHardware } from '../domain/hardware-summary'
import { AdminDevicesRepository } from '../repositories/admin-devices.repository'

@Injectable()
export class GetHardwareSummaryUseCase {
  constructor(private readonly devices: AdminDevicesRepository) {}

  async execute(): Promise<HardwareSummary> {
    return summarizeHardware(await this.devices.listCollected())
  }
}

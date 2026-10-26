import { Injectable } from '@nestjs/common'
import type { AdminDeviceRecord, Page, PageQuery } from '../domain/admin-records'
import { AdminDevicesRepository } from '../repositories/admin-devices.repository'

// Every device report of the base, with the user who sent it.
@Injectable()
export class ListDevicesUseCase {
  constructor(private readonly devices: AdminDevicesRepository) {}

  execute(query: PageQuery): Promise<Page<AdminDeviceRecord>> {
    return this.devices.list(query)
  }
}

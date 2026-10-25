import type { CollectedHardware } from '@gameplay/contracts'
import type { AdminDeviceRecord, Page, PageQuery } from '../../domain/admin-records'
import { AdminDevicesRepository } from '../admin-devices.repository'

export class InMemoryAdminDevicesRepository extends AdminDevicesRepository {
  readonly devices: AdminDeviceRecord[] = []

  async listCollected(): Promise<CollectedHardware[]> {
    return this.devices.map(({ collected }) => collected)
  }

  async list({ search, page, pageSize }: PageQuery): Promise<Page<AdminDeviceRecord>> {
    const term = search?.toLowerCase()
    const matching = this.devices
      .filter((device) => !term || device.user.username.toLowerCase().includes(term))
      .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())
    const start = (page - 1) * pageSize
    return { items: matching.slice(start, start + pageSize), total: matching.length }
  }
}

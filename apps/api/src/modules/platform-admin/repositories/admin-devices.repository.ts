import type { CollectedHardware } from '@gameplay/contracts'
import type { AdminDeviceRecord, Page, PageQuery } from '../domain/admin-records'

// Read side of the device reports for the admin panel.
export abstract class AdminDevicesRepository {
  // What every device reported, for the base summary.
  abstract listCollected(): Promise<CollectedHardware[]>
  // Every report with who sent it, newest first; search matches the username.
  abstract list(query: PageQuery): Promise<Page<AdminDeviceRecord>>
}

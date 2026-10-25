import type { CollectedHardware } from '@gameplay/shared'

// Read side of the device reports for the admin panel.
export abstract class AdminDevicesRepository {
  // What every device reported, for the base summary.
  abstract listCollected(): Promise<CollectedHardware[]>
}

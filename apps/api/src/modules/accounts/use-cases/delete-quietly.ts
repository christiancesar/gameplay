import { Logger } from '@nestjs/common'
import type { StorageProvider } from '../../storage/providers/storage/storage.provider'

const logger = new Logger('Avatar')

// The account already points at the new state; a file left behind is only
// wasted space, so a failed delete doesn't fail the request.
export async function deleteQuietly(storage: StorageProvider, key: string): Promise<void> {
  try {
    await storage.delete(key)
  } catch (error) {
    logger.warn({ err: error, key }, 'Could not delete the previous avatar')
  }
}

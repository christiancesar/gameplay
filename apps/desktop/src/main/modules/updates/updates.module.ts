import { autoUpdater } from 'electron'

import type { Logger } from '../logging/logger'
import { UpdatesService } from './updates.service'

export function createUpdatesModule(logger: Logger, isPackaged: boolean, args: readonly string[]) {
  const service = new UpdatesService({
    updater: autoUpdater,
    logger,
    isPackaged,
    platform: process.platform,
    args,
  })
  return { service }
}

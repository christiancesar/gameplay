import { Logger } from '@nestjs/common'
import type { StorageProvider } from '../../storage/storage.provider'
import type { ServerRecord } from '../domain/server'

export type ServerImageKind = 'icon' | 'cover'

// Icon: square 256. Cover: 16:9 1280x720.
export const SERVER_IMAGES = {
  icon: { profile: 'square256', folder: 'icons', field: 'iconKey' },
  cover: { profile: 'cover1280x720', folder: 'covers', field: 'coverKey' },
} as const

const logger = new Logger('ServerImage')

// Runs once the server points at the new state; a failed delete only leaves
// a file behind, so it is logged instead of failing the request.
export async function deletePreviousImage(
  storage: StorageProvider,
  server: ServerRecord,
  kind: ServerImageKind,
  newKey: string | null,
): Promise<void> {
  const previous = server[SERVER_IMAGES[kind].field]
  if (!previous || previous === newKey) return
  try {
    await storage.delete(previous)
  } catch (error) {
    logger.warn({ err: error, key: previous }, 'Could not delete the previous server image')
  }
}

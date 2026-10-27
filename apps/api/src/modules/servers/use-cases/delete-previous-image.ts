import { Logger } from '@nestjs/common'
import type { StorageProvider } from '../../storage/providers/storage/storage.provider'
import { SERVER_IMAGES, type ServerImageKind } from '../domain/server-images'
import type { ServerRecord } from '../domain/server'

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

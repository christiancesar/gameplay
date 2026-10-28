import path from 'node:path'

import type { Logger } from '../logging/logger'
import { audioHandlers } from './audio.handlers'
import { VenmicAppAudioProvider, type PatchBayConstructor } from './providers/venmic/venmic.app-audio.provider'
import { AppAudioService } from './services/app-audio.service'

/** The native module is Linux only and may be missing: it is asked for when first needed, and its absence is an answer. */
function loadVenmic(logger: Logger): PatchBayConstructor | null {
  if (process.platform !== 'linux') return null
  try {
    return (require('@vencord/venmic') as { PatchBay: PatchBayConstructor }).PatchBay
  } catch (err) {
    logger.warn({ err }, 'The venmic module could not be loaded')
    return null
  }
}

/** Puts the audio module together: PipeWire on Linux, with the binary of this app named so its own sound is left out. */
export function createAudioModule(executablePath: string, logger: Logger) {
  const service = new AppAudioService(
    new VenmicAppAudioProvider(() => loadVenmic(logger), path.basename(executablePath), logger),
  )
  return { service, handlers: audioHandlers(service) }
}

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

import { BrowserWindow } from 'electron'

import type { Logger } from '../logging/logger'
import type { MainTelemetry } from '../telemetry/main-telemetry'
import { WindowsHelperSystemAudioProvider } from './providers/windows/windows-helper.system-audio.provider'
import { SystemAudioService } from './services/system-audio.service'
import { systemAudioHandlers } from './system-audio.handlers'

/** The PCM goes to every window of the app (there is one), as an event. */
function sendToWindows(chunk: Uint8Array): void {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('system-audio:pcm', chunk)
}

/**
 * Puts the system audio module together: on Windows, the capture helper at `helperPath` leaves this process out of
 * the sound it captures; elsewhere `helperPath` is null and the module says it is not available.
 */
export function createSystemAudioModule(helperPath: string | null, logger: Logger, telemetry: MainTelemetry) {
  const provider = new WindowsHelperSystemAudioProvider(
    process.platform === 'win32' ? helperPath : null,
    process.pid,
    (executable, args) => spawn(executable, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }),
    existsSync,
    logger,
  )
  const service = new SystemAudioService(provider, sendToWindows)
  return { service, handlers: systemAudioHandlers(service, telemetry) }
}

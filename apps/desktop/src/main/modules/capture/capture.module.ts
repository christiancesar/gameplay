import { BrowserWindow } from 'electron'

import { captureHandlers } from './capture.handlers'
import { ElectronCaptureSourceProvider } from './providers/electron/electron.capture-source.provider'
import { CaptureSourceService } from './services/capture-source.service'

/** Puts the capture module together: `desktopCapturer`, with this app's windows kept out of the list. */
export function createCaptureModule() {
  const service = new CaptureSourceService(
    new ElectronCaptureSourceProvider(() => BrowserWindow.getAllWindows().map((window) => window.getMediaSourceId())),
  )
  return { service, handlers: captureHandlers(service) }
}

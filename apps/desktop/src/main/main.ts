import { app, BrowserWindow, ipcMain, session } from 'electron'

import { registerAppScheme, serveApp } from './lib/app-protocol'
import { registerIpc } from './lib/ipc'
import { limitPermissions } from './lib/permissions'
import { createMainWindow, devServerUrl, rendererRoot } from './lib/window'
import { createAudioModule } from './modules/audio/audio.module'
import { installDisplayMediaHandler } from './modules/capture/display-media-handler'
import { installCookiePolicy } from './modules/session/cookie-policy'
import { createServerModule } from './modules/server/server.module'
import { isAppUrl } from './utils/app-url'

registerAppScheme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  void app.whenReady().then(async () => {
    const server = createServerModule(app.getPath('userData'))
    const audio = createAudioModule(process.execPath)
    await server.service.load()

    serveApp(rendererRoot(), () => server.service.current())
    installCookiePolicy(session.defaultSession, (url) => server.service.isOnServer(url))
    limitPermissions(session.defaultSession, devServerUrl())
    installDisplayMediaHandler(session.defaultSession)
    registerIpc(ipcMain, { ...server.handlers, ...audio.handlers }, (url) => isAppUrl(url, devServerUrl()))
    // The virtual microphone must not outlive the app.
    app.on('before-quit', () => audio.service.stop())
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

import { app, BrowserWindow, session } from 'electron'

import { registerAppScheme, serveApp } from './app-protocol'
import { registerIpc } from './ipc'
import { installDisplayMediaHandler } from './modules/capture/display-media-handler'
import { installCookiePolicy } from './modules/session/cookie-policy'
import { isAppUrl, limitPermissions } from './security'
import { createMainWindow, devServerUrl, rendererRoot } from './window'

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

  void app.whenReady().then(() => {
    serveApp(rendererRoot())
    installCookiePolicy(session.defaultSession, (url) => isAppUrl(url, devServerUrl()))
    limitPermissions(session.defaultSession, devServerUrl())
    installDisplayMediaHandler(session.defaultSession)
    registerIpc()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

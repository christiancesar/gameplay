import { app, BrowserWindow, ipcMain, session } from 'electron'

import { registerAppScheme, serveApp } from './lib/app-protocol'
import { registerIpc } from './lib/ipc'
import { limitPermissions } from './lib/permissions'
import { createMainWindow, devServerUrl, rendererRoot } from './lib/window'
import { createAudioModule } from './modules/audio/audio.module'
import { installDisplayMediaHandler } from './modules/capture/display-media-handler'
import { captureErrors } from './modules/logging/error-capture'
import { createLoggingModule } from './modules/logging/logging.module'
import { pinoTelemetryStream } from './modules/telemetry/pino-telemetry-stream'
import { createTelemetryModule } from './modules/telemetry/telemetry.module'
import { installCookiePolicy } from './modules/session/cookie-policy'
import { createServerModule } from './modules/server/server.module'
import { isAppUrl } from './utils/app-url'
import { contentSecurityPolicy } from './utils/content-security-policy'
import { fixedServerFrom } from './utils/fixed-server'

registerAppScheme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  // Only the instance that stays opens the log: a second one quits at once and must not rotate it.
  // Sentry starts first, so what goes wrong while the app starts is seen. Without a DSN in the build it reports nowhere.
  const telemetry = createTelemetryModule({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || (app.isPackaged ? 'production' : 'development'),
    release: `gameplay-desktop@${app.getVersion()}`,
  })
  const { logger, file: logFile } = createLoggingModule({
    dir: app.getPath('logs'),
    echo: !app.isPackaged,
    // The local log also goes to Sentry as logs, from info up.
    extraStreams: [{ level: 'info', stream: pinoTelemetryStream(telemetry) }],
  })
  captureErrors(logger, { app, proc: process })
  logger.info(
    {
      version: app.getVersion(),
      electron: process.versions.electron,
      chromium: process.versions.chrome,
      platform: process.platform,
      sessionType: process.env.XDG_SESSION_TYPE,
      packaged: app.isPackaged,
      logFile,
    },
    'Gameplay started',
  )

  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  void app.whenReady().then(async () => {
    const fixedServer = fixedServerFrom(import.meta.env.VITE_SERVER_URL)
    const server = createServerModule(app.getPath('userData'), fixedServer)
    const audio = createAudioModule(process.execPath, logger, telemetry)
    await server.service.load()

    serveApp(rendererRoot(), () => server.service.current(), contentSecurityPolicy(fixedServer))
    installCookiePolicy(session.defaultSession, (url) => server.service.isOnServer(url))
    limitPermissions(session.defaultSession, devServerUrl())
    installDisplayMediaHandler(session.defaultSession, logger)
    registerIpc(ipcMain, { ...server.handlers, ...audio.handlers }, (url) => isAppUrl(url, devServerUrl()))
    // The virtual microphone must not outlive the app.
    app.on('before-quit', () => {
      audio.service.stop()
      logger.info('Gameplay closing')
      void telemetry.flush(2000)
    })
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

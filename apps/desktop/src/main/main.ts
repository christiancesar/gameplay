import path from 'node:path'

import { app, BrowserWindow, ipcMain, session } from 'electron'
import squirrelStartup from 'electron-squirrel-startup'

import { registerAppScheme, serveApp } from './lib/app-protocol'
import { registerIpc } from './lib/ipc'
import { limitPermissions } from './lib/permissions'
import { createMainWindow, devServerUrl, rendererRoot } from './lib/window'
import { createAudioModule } from './modules/audio/audio.module'
import { createCaptureModule } from './modules/capture/capture.module'
import { installDisplayMediaHandler } from './modules/capture/display-media-handler'
import { captureErrors } from './modules/logging/error-capture'
import { createLoggingModule } from './modules/logging/logging.module'
import { pinoTelemetryStream } from './modules/telemetry/pino-telemetry-stream'
import { createTelemetryModule } from './modules/telemetry/telemetry.module'
import { installCookiePolicy } from './modules/session/cookie-policy'
import { createServerModule } from './modules/server/server.module'
import { createSystemAudioModule } from './modules/system-audio/system-audio.module'
import { isAppUrl } from './utils/app-url'
import { contentSecurityPolicy } from './utils/content-security-policy'
import { fixedServerFrom } from './utils/fixed-server'

// The Windows installer starts the app with --squirrel-* flags to make or remove shortcuts: handle them and leave.
if (squirrelStartup || !app.requestSingleInstanceLock()) {
  app.quit()
} else {
  const cdpPort = 9223
  if (import.meta.env.VITE_APP_ENV === 'development') {
    app.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1')
    app.commandLine.appendSwitch('remote-debugging-port', String(cdpPort))
  }

  // Only the instance that stays opens the log: a second one quits at once and must not rotate it.
  // Sentry starts first, so what goes wrong while the app starts is seen. Without a DSN in the build it reports nowhere.
  const telemetry = createTelemetryModule({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.VITE_APP_ENV || 'development',
    release: `gameplay-desktop@${app.getVersion()}`,
  })
  // After Sentry, which registers its own scheme with the same call and keeps later calls from undoing it. Before
  // it, Sentry's registration replaced ours: `app://` lost `secure`, and a page that is not a secure context has no
  // microphone (`navigator.mediaDevices` is undefined).
  registerAppScheme()
  const loggingEnabled = import.meta.env.VITE_APP_ENV !== 'production'
  const { logger, file: logFile } = createLoggingModule({
    enabled: loggingEnabled,
    dir: app.getPath('logs'),
    echo: !app.isPackaged,
    // The local log also goes to Sentry as logs, from info up.
    extraStreams: loggingEnabled ? [{ level: 'info', stream: pinoTelemetryStream(telemetry) }] : [],
  })
  captureErrors(logger, { app, proc: process, captureRendererConsole: loggingEnabled })
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
  if (import.meta.env.VITE_APP_ENV === 'development')
    logger.info({ address: '127.0.0.1', port: cdpPort }, 'Renderer CDP debugging enabled')

  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  void app.whenReady().then(async () => {
    const fixedServer = fixedServerFrom(import.meta.env.VITE_APP_ENV, import.meta.env.VITE_SERVER_URL)
    const server = createServerModule(app.getPath('userData'), fixedServer)
    const audio = createAudioModule(process.execPath, logger, telemetry)
    const capture = createCaptureModule()
    // The Windows capture helper: next to the app once packaged, in the project folder while developing.
    const systemAudio = createSystemAudioModule(
      app.isPackaged
        ? path.join(process.resourcesPath, 'gameplay-audio-capture.exe')
        : path.join(app.getAppPath(), 'native/audio-capture/build/gameplay-audio-capture.exe'),
      logger,
      telemetry,
    )
    await server.service.load()

    serveApp(rendererRoot(), () => server.service.current(), contentSecurityPolicy(fixedServer))
    installCookiePolicy(session.defaultSession, (url) => server.service.isOnServer(url))
    limitPermissions(session.defaultSession, devServerUrl())
    installDisplayMediaHandler(session.defaultSession, capture.service, logger)
    registerIpc(
      ipcMain,
      { ...server.handlers, ...audio.handlers, ...capture.handlers, ...systemAudio.handlers },
      (url) => isAppUrl(url, devServerUrl()),
    )
    // The virtual microphone must not outlive the app.
    app.on('before-quit', () => {
      audio.service.stop()
      systemAudio.service.stop()
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

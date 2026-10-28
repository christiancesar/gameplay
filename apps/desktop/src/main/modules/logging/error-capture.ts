import type { App, WebContents } from 'electron'

import type { Logger } from './logger'

/**
 * Electron has central places for what goes wrong, so nothing needs a try/catch just to be seen: the main process
 * (`process`), the other processes (`app`), and every window (`web-contents-created`, which also covers the
 * renderer's uncaught errors, since Chromium prints them to its console).
 */
export function captureErrors(logger: Logger, { app, proc }: { app: App; proc: NodeJS.Process }): void {
  // The monitor only watches: Electron's own handling of the exception (the error dialog) stays as it is.
  proc.on('uncaughtExceptionMonitor', (err, origin) =>
    logger.error({ err, origin }, 'Uncaught exception in the main process'),
  )
  proc.on('unhandledRejection', (reason) =>
    logger.error({ err: reason }, 'Unhandled promise rejection in the main process'),
  )
  proc.on('warning', (warning) => logger.warn({ err: warning }, 'Node warning'))

  app.on('render-process-gone', (_event, contents, details) => {
    const data = { reason: details.reason, exitCode: details.exitCode, url: contents.getURL() }
    // A window that closes normally goes through here too.
    if (details.reason === 'clean-exit') logger.debug(data, 'Renderer process ended')
    else logger.error(data, 'Renderer process gone')
  })
  // On the way out Chromium stops its own helpers, which is not a failure.
  let quitting = false
  app.on('before-quit', () => (quitting = true))
  app.on('child-process-gone', (_event, details) => {
    const data = { type: details.type, reason: details.reason, exitCode: details.exitCode, name: details.name }
    if (quitting || details.reason === 'clean-exit') logger.debug(data, 'Child process ended')
    else logger.error(data, 'Child process gone')
  })
  app.on('web-contents-created', (_event, contents) => captureContents(logger, contents))
}

const ERR_ABORTED = -3

/** One window: its console (warnings and errors, the rest as debug), failed loads and a page that stopped answering. */
export function captureContents(logger: Logger, contents: WebContents): void {
  contents.on('console-message', (event) => {
    const { level, message, lineNumber, sourceId } = event
    // The DevTools talk to themselves; none of it is the app's.
    if (sourceId.startsWith('devtools://')) return
    const data = { source: sourceId, line: lineNumber, message }
    if (level === 'error') logger.error(data, 'Renderer console error')
    else if (level === 'warning') logger.warn(data, 'Renderer console warning')
    else logger.debug(data, 'Renderer console')
  })
  contents.on('did-fail-load', (_event, errorCode, errorDescription, url, isMainFrame) => {
    // A navigation the app cancelled itself (the locked navigation) is not a failure.
    if (errorCode === ERR_ABORTED) return
    logger.error({ errorCode, errorDescription, url, isMainFrame }, 'Page failed to load')
  })
  contents.on('preload-error', (_event, preloadPath, err) =>
    logger.error({ preloadPath, err }, 'Preload script failed'),
  )
  contents.on('unresponsive', () => logger.warn({ url: contents.getURL() }, 'Window stopped responding'))
  contents.on('responsive', () => logger.info({ url: contents.getURL() }, 'Window responds again'))
}

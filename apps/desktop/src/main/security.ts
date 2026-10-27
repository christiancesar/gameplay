import { DESKTOP_APP_ORIGIN } from '@gameplay/contracts'
import { type Session, type WebContents, shell } from 'electron'

const APP_URL = new URL(DESKTOP_APP_ORIGIN)
const APP_SCHEME = APP_URL.protocol.replace(':', '')
const APP_HOST = APP_URL.host

/**
 * What the pages of the app may load. The server is chosen at run time, so the connections it makes are open
 * to https and to this machine; everything else (scripts, frames, plugins) is the app's own.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

/** The page the app serves itself. `devServerUrl` is the Vite server of `npm run start`. */
function isAppUrl(url: string, devServerUrl?: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === `${APP_SCHEME}:` && parsed.host === APP_HOST) return true
    return devServerUrl !== undefined && parsed.origin === new URL(devServerUrl).origin
  } catch {
    return false
  }
}

/** Only the web leaves the app, in the user's browser; any other scheme (file:, app:, javascript:) stays put. */
function isWebUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/** The window never leaves the app: links to the web open in the system browser, every other navigation stops. */
function lockNavigation(contents: WebContents, devServerUrl?: string): void {
  contents.on('will-navigate', (event, url) => {
    if (isAppUrl(url, devServerUrl)) return
    event.preventDefault()
    if (isWebUrl(url)) void shell.openExternal(url)
  })
  contents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
}

const ALLOWED_PERMISSIONS = new Set([
  'media',
  'display-capture',
  'fullscreen',
  'clipboard-sanitized-write',
  'notifications',
])

/** The app asks for the microphone, the screen, full screen and notifications; nothing else is granted. */
function limitPermissions(session: Session, devServerUrl?: string): void {
  session.setPermissionRequestHandler((_contents, permission, callback, details) => {
    callback(ALLOWED_PERMISSIONS.has(permission) && isAppUrl(details.requestingUrl, devServerUrl))
  })
  session.setPermissionCheckHandler((_contents, permission, requestingOrigin) => {
    return ALLOWED_PERMISSIONS.has(permission) && isAppUrl(requestingOrigin, devServerUrl)
  })
}

export { APP_HOST, APP_SCHEME, CONTENT_SECURITY_POLICY, isAppUrl, isWebUrl, limitPermissions, lockNavigation }

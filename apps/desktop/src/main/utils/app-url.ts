import { DESKTOP_APP_ORIGIN } from '@gameplay/contracts'

const APP_URL = new URL(DESKTOP_APP_ORIGIN)
const APP_SCHEME = APP_URL.protocol.replace(':', '')
const APP_HOST = APP_URL.host

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

export { APP_HOST, APP_SCHEME, isAppUrl, isWebUrl }

import type { Session } from 'electron'

import { isAppUrl } from '../utils/app-url'

const ALLOWED_PERMISSIONS = new Set([
  'media',
  'display-capture',
  'fullscreen',
  'clipboard-sanitized-write',
  'notifications',
])

/** The app asks for the microphone, the screen, full screen and notifications; nothing else is granted. */
export function limitPermissions(session: Session, devServerUrl?: string): void {
  session.setPermissionRequestHandler((_contents, permission, callback, details) => {
    callback(ALLOWED_PERMISSIONS.has(permission) && isAppUrl(details.requestingUrl, devServerUrl))
  })
  session.setPermissionCheckHandler((_contents, permission, requestingOrigin) => {
    return ALLOWED_PERMISSIONS.has(permission) && isAppUrl(requestingOrigin, devServerUrl)
  })
}

import { type WebContents, shell } from 'electron'

import { isAppUrl, isWebUrl } from '../utils/app-url'

/** The window never leaves the app: links to the web open in the system browser, every other navigation stops. */
export function lockNavigation(contents: WebContents, devServerUrl?: string): void {
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

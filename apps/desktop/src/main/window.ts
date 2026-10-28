import path from 'node:path'
import { BrowserWindow, nativeImage } from 'electron'

import { lockNavigation } from './security'
import linuxIcon from '../../../../packages/client/src/shared/assets/brand/icons/linux/icon.png?inline'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

/** Where the built front-end is, next to the main process bundle. */
const rendererRoot = () => path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`)

const devServerUrl = () => MAIN_WINDOW_VITE_DEV_SERVER_URL

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Gameplay',
    backgroundColor: '#0a0a0a',
    // Linux has no icon of its own in a package, so the window carries it. Windows and macOS take the one the
    // package embeds (see forge.config.ts).
    icon: process.platform === 'linux' ? nativeImage.createFromDataURL(linuxIcon) : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })
  lockNavigation(window.webContents, devServerUrl())
  void window.loadURL(devServerUrl() ?? `app://gameplay/`)
  return window
}

export { createMainWindow, devServerUrl, rendererRoot }

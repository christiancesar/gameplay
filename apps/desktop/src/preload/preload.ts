// Lets the window send what Sentry sees through the main process (events, scope, breadcrumbs). The main bundle
// cannot inject it by itself, so it is part of this one.
import '@sentry/electron/preload'
import { createBridge } from '@gameplay/desktop-bridge/bridge'
import { contextBridge, ipcRenderer } from 'electron'

// The page gets one typed function per channel of the contract, `on` for the events of the main process, and
// neither ipcRenderer nor anything else.
contextBridge.exposeInMainWorld(
  'gameplayDesktop',
  createBridge(
    (channel, input) => ipcRenderer.invoke(channel, input),
    (event, listener) => {
      const handler = (_event: unknown, payload: unknown) => (listener as (payload: unknown) => void)(payload)
      ipcRenderer.on(event, handler)
      return () => void ipcRenderer.removeListener(event, handler)
    },
  ),
)

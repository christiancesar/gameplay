import { createBridge } from '@gameplay/desktop-bridge/bridge'
import { contextBridge, ipcRenderer } from 'electron'

// The page gets one typed function per channel of the contract, and neither ipcRenderer nor anything else.
contextBridge.exposeInMainWorld(
  'gameplayDesktop',
  createBridge((channel, input) => ipcRenderer.invoke(channel, input)),
)

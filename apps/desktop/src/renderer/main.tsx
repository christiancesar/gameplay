import { App } from '@gameplay/client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { createDesktopPlatform } from './desktop-platform'

// What the main process knows comes before the first screen: the server (the user's choice, or the build's), and whether the system can
// share the sound of applications.
const bridge = window.gameplayDesktop
const [server, appAudio] = await Promise.all([bridge['server:get-url'](), bridge['audio:available']()])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      platform={createDesktopPlatform({
        bridge,
        server,
        serverFixed: Boolean(import.meta.env.VITE_SERVER_URL?.trim()),
        appAudio,
      })}
    />
  </StrictMode>,
)

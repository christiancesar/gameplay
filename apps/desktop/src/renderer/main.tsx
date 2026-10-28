import { App } from '@gameplay/client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { createDesktopPlatform } from './desktop-platform'

// The server the user chose lives in the main process: the app asks for it before anything else.
const bridge = window.gameplayDesktop
const server = await bridge['server:get-url']()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App platform={createDesktopPlatform({ bridge, server })} />
  </StrictMode>,
)

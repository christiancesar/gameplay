import { App } from '@gameplay/client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createBrowserPlatform } from './browser-platform'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App platform={createBrowserPlatform()} />
  </StrictMode>,
)

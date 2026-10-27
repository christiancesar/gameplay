import { App, createBrowserPlatform } from '@gameplay/client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App platform={createBrowserPlatform()} />
  </StrictMode>,
)

import { App } from '@gameplay/client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { createDesktopPlatform } from './desktop-platform'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App platform={createDesktopPlatform()} />
  </StrictMode>,
)

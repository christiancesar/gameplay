import { createContext } from 'react'

import type { Platform } from './platform'

const PlatformContext = createContext<Platform | null>(null)

export { PlatformContext }

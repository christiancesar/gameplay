import { use } from 'react'

import type { Platform } from './platform'
import { PlatformContext } from './platform-context'

function usePlatform(): Platform {
  const platform = use(PlatformContext)
  if (!platform) throw new Error('usePlatform needs a PlatformProvider above it')
  return platform
}

export { usePlatform }

import type { ReactNode } from 'react'

import type { Platform } from './platform'
import { PlatformContext } from './platform-context'

/** Gives the host's platform to the tree. The app mounts it once; Storybook mounts a fake. */
function PlatformProvider({ platform, children }: { platform: Platform; children: ReactNode }) {
  return <PlatformContext value={platform}>{children}</PlatformContext>
}

export { PlatformProvider }

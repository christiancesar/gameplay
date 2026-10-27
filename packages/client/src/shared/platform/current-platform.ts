import type { Platform } from './platform'

let current: Platform | undefined

/** Set once when the app mounts. The controllers that live outside React read it from here. */
function setCurrentPlatform(platform: Platform): void {
  current = platform
}

function currentPlatform(): Platform {
  if (!current) throw new Error('No platform: mount <App platform={...} /> before using the capture')
  return current
}

export { currentPlatform, setCurrentPlatform }

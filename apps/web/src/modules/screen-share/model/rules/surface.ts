import type { ShareSurface } from '../entities/share'

/** The `displaySurface` the browser reports for a capture, narrowed to the ones we know. */
function toSurface(value: string | undefined): ShareSurface {
  return value === 'monitor' || value === 'window' || value === 'browser' ? value : 'unknown'
}

/** Sharing the entire screen with its own preview open draws a mirror; start hidden there. */
function isPreviewHiddenByDefault(surface: ShareSurface): boolean {
  return surface === 'monitor'
}

export { isPreviewHiddenByDefault, toSurface }

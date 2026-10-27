import type { ScreenCaptureResult } from '@/shared/media/screen-capture'

/** A screen or a window the host can capture, with a preview, for hosts that list them (the desktop app). */
type CaptureSource = {
  id: string
  name: string
  kind: 'screen' | 'window'
  /** Data URL of a small preview, when the host makes one. */
  thumbnail: string | null
}

type CaptureRequest = {
  /** What the browser's picker is asked for: surface, resolution, frame rate and audio. */
  options: DisplayMediaStreamOptions
  /** A source chosen from `listSources`; null leaves the choice to the host's own picker. */
  sourceId: string | null
}

/** What the host running the app can do beyond what every browser does. */
type PlatformCapabilities = {
  /** The app lists screens and windows itself; in a browser the picker does it. */
  listSources: boolean
  /** The audio of a single window can be shared. */
  windowAudio: boolean
  /** The audio of the whole system can be shared along with a screen. */
  systemAudio: boolean
  /** Shortcuts that work with the app out of focus. */
  globalHotkeys: boolean
}

/**
 * The host the front-end runs in. The web and the desktop app each inject their own, so ViewModels never import
 * a browser API or Electron to capture a screen.
 */
type Platform = {
  kind: 'browser' | 'desktop'
  capabilities: PlatformCapabilities
  capture: {
    listSources: () => Promise<CaptureSource[]>
    start: (request: CaptureRequest) => Promise<ScreenCaptureResult>
  }
}

export type { CaptureRequest, CaptureSource, Platform, PlatformCapabilities }

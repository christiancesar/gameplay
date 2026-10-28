import type { ScreenCaptureHandle, ScreenCaptureResult } from '@/shared/media/screen-capture'

/** A screen or a window the host can capture, with a preview, for hosts that list them (the desktop app). */
type CaptureSource = {
  id: string
  name: string
  kind: 'screen' | 'window'
  /** Data URL of a small preview, when the host makes one. */
  thumbnail: string | null
}

/** An application that is playing sound, by the name the system gives it. */
type AudioApp = { name: string; binary: string | null }

type CaptureRequest = {
  /** What the browser's picker is asked for: surface, resolution, frame rate and audio. */
  options: DisplayMediaStreamOptions
  /** A source chosen from `listSources`; null leaves the choice to the host's own picker. */
  sourceId: string | null
  /** The applications whose sound goes with the video, for a host with `appAudio`. Empty: the audio in `options`. */
  audioApps?: readonly string[]
}

/** What the host running the app can do beyond what every browser does. */
type PlatformCapabilities = {
  /** The app lists screens and windows itself; in a browser the picker does it. */
  listSources: boolean
  /** The audio of a single window can be shared. */
  windowAudio: boolean
  /** The audio of the whole system can be shared along with a screen. */
  systemAudio: boolean
  /** The sound of chosen applications can be shared, whichever screen or window is. */
  appAudio: boolean
  /** Shortcuts that work with the app out of focus. */
  globalHotkeys: boolean
}

/** Where the API is, as far as the host knows. The session is a cookie on every host. */
type PlatformServer = {
  /** Origin of the API, with no trailing slash. Empty on the web, where the page and the API share an origin. */
  baseUrl: () => string
  /**
   * Present when the user picks the server the app talks to (the desktop app). The app asks for the address
   * before anything else while `current` is null.
   */
  chooser?: {
    current: () => string | null
    /** Keeps the server; the app moves on when it is done (a host that stores it elsewhere answers late). */
    choose: (origin: string) => void | Promise<void>
  }
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
    /** Lets go of a capture: its tracks, and whatever the host set up for its audio. */
    stop: (capture: ScreenCaptureHandle) => void
    /** The applications playing sound now; empty where the host cannot share them. */
    listAudioApps: () => Promise<AudioApp[]>
  }
  server: PlatformServer
}

export type { AudioApp, CaptureRequest, CaptureSource, Platform, PlatformCapabilities, PlatformServer }

import type { ScreenCaptureHandle, ScreenCaptureResult } from '@/shared/media/screen-capture'

/** A screen or a window the host can capture, with a preview, for hosts that list them (the desktop app). */
type CaptureSource = {
  id: string
  name: string
  kind: 'screen' | 'window'
  /** Data URL of a small preview, when the host makes one. */
  thumbnail: string | null
  /** Data URL of the icon of the application, for a window, when the host has it. */
  appIcon: string | null
  /** Physical source dimensions and refresh rate, when the host can determine them before capture. */
  width?: number | null
  height?: number | null
  refreshRate?: number | null
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
  /** The sound of the computer can be shared without the app's own, so the call does not come back to the viewers. */
  systemAudioWithoutApp: boolean
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
 * Where the host sends errors and measurements. Each host reads it from its own build (the web from `VITE_*` of its
 * env file, the desktop app from its own), so the client never reads the environment itself.
 */
type TelemetryConfig = {
  /** Which application is sending: a tag on everything, next to the project. */
  app: 'web' | 'desktop'
  /** Where it runs: `development`, `production`, `host`. Not the app, which has its own tag. */
  environment: string
  release: string
  /** Whether application logs may be sent to the telemetry provider. Errors and measurements are independent. */
  logs?: boolean
  /**
   * Absent: Sentry stays off. `tunnel` is a path of the server (the web) or a full URL. `start` is how a host
   * whose SDK wraps the framework one starts it (the desktop app: the Electron renderer SDK, which sends through
   * the main process); without it the client starts Sentry itself.
   */
  sentry: {
    dsn: string
    tunnel?: string
    start?: (options: object, frameworkInit: (options: never) => void) => void
  } | null
  /** Absent: Grafana Faro stays off. A path of the server (the tunnel) or a full URL. */
  faro: { url: string } | null
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
  telemetry: TelemetryConfig
}

export type { AudioApp, CaptureRequest, CaptureSource, Platform, PlatformCapabilities, PlatformServer, TelemetryConfig }

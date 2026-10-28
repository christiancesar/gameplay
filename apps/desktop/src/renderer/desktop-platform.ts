import {
  acquireScreen,
  audioCapabilitiesOf,
  stopScreen,
  type CapturePlatformSource,
  type Platform,
  type TelemetryConfig,
} from '@gameplay/client/platform'
import type { DesktopBridge } from '@gameplay/desktop-bridge/bridge'
import { init as initElectronSentry } from '@sentry/electron/renderer'

/** What the releases of the app are called in Sentry, in the window and in the main process alike. */
const RELEASE_NAME = 'gameplay-desktop'

type RendererOptions = NonNullable<Parameters<typeof initElectronSentry>[0]>

/** Starts Sentry in the window through the Electron renderer SDK, around the React one. */
const startSentry = (options: object, frameworkInit: (options: never) => void): void =>
  initElectronSentry(options as RendererOptions, frameworkInit as (options: RendererOptions) => void)

/**
 * The Sentry project of the app, from the `VITE_*` of `apps/desktop/.env` baked in at build time. It is the
 * developer's own project, whichever server the user picks. Faro is the web's: the app has no collector.
 */
function telemetryFromBuild(env: ImportMetaEnv): TelemetryConfig {
  return {
    app: 'desktop',
    environment: env.VITE_SENTRY_ENVIRONMENT || env.VITE_APP_ENV || env.MODE,
    release: `${RELEASE_NAME}@${env.VITE_APP_VERSION}`,
    // The window's events go through the main process, which holds the DSN: the Electron renderer SDK wraps the
    // React one, as the documentation of Sentry for Electron says.
    sentry: env.VITE_SENTRY_DSN ? { dsn: env.VITE_SENTRY_DSN, start: startSentry } : null,
    faro: null,
  }
}

/** The name of the virtual microphone the main process makes out of the chosen applications' sound. */
const VIRTUAL_MICROPHONE = /vencord-screen-share/
const VIRTUAL_MICROPHONE_WAIT_MS = 3000

/** The virtual microphone shows up a moment after it is made: ask for it until it does. */
async function openVirtualMicrophone(): Promise<MediaStreamTrack | null> {
  const deadline = Date.now() + VIRTUAL_MICROPHONE_WAIT_MS
  do {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const device = devices.find(
      (candidate) => candidate.kind === 'audioinput' && VIRTUAL_MICROPHONE.test(candidate.label),
    )
    if (device) {
      // The sound of a game is not a voice: no echo cancelling, no noise reduction, no gain.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
      })
      return stream.getAudioTracks()[0] ?? null
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  } while (Date.now() < deadline)
  return null
}

type DesktopPlatformOptions = {
  bridge: DesktopBridge
  /** The server the user chose before, or the one the build is tied to; null before a choice. */
  server: string | null
  /** Whether the build is tied to its server: there is nothing to choose. */
  serverFixed: boolean
  /** Whether the system can share the sound of applications (Linux with PipeWire). */
  appAudio: boolean
}

/**
 * The desktop host. Its video capture is the Chromium inside Electron (the main process answers the request); the
 * sound of the applications the user picks comes through a virtual microphone the main process makes. The user
 * picks the server, which the main process keeps between runs and uses for the images and for the cookie; a
 * build tied to a server (`VITE_SERVER_URL`) has no choice to offer. The session is a cookie, as on the web: the main process makes the cookie of the server travel between sites.
 */
function createDesktopPlatform({ bridge, server, serverFixed, appAudio }: DesktopPlatformOptions): Platform {
  let chosen = server
  return {
    kind: 'desktop',
    capabilities: {
      listSources: false,
      appAudio,
      globalHotkeys: false,
      ...audioCapabilitiesOf(navigator as unknown as CapturePlatformSource),
    },
    capture: {
      listSources: async () => [],
      start: async ({ options, audioApps }) => {
        if (!appAudio || !audioApps?.length) return acquireScreen(options)
        // The video without audio of its own; the sound is the applications' one, added below.
        const video = await acquireScreen({ ...options, audio: false })
        if (!video.ok) return video
        const shared = await bridge['audio:share']({ mode: 'apps', apps: [...audioApps] })
        const audio = shared ? await openVirtualMicrophone() : null
        if (!audio) {
          await bridge['audio:stop']()
          return video
        }
        video.capture.stream.addTrack(audio)
        return { ok: true, capture: { ...video.capture, audio } }
      },
      stop: (capture) => {
        stopScreen(capture)
        // Without a share there is nothing to take down; the main process knows.
        void bridge['audio:stop']()
      },
      listAudioApps: async () => (appAudio ? bridge['audio:list-apps']() : []),
    },
    server: {
      baseUrl: () => chosen ?? '',
      chooser: serverFixed
        ? undefined
        : {
            current: () => chosen,
            choose: async (origin) => {
              await bridge['server:set-url'](origin)
              chosen = origin
            },
          },
    },
    telemetry: telemetryFromBuild(import.meta.env),
  }
}

export { createDesktopPlatform, telemetryFromBuild }

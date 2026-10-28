import {
  acquireScreen,
  audioCapabilitiesOf,
  stopScreen,
  type CapturePlatformSource,
  type Platform,
  type TelemetryConfig,
} from '@gameplay/client/platform'
import type { DesktopBridge } from '@gameplay/desktop-bridge/bridge'

/** What the releases of the app are called in Sentry, in the window and in the main process alike. */
const RELEASE_NAME = 'gameplay-desktop'

/**
 * The Sentry project of the app, from the `VITE_*` of `apps/desktop/.env` baked in at build time. It is the
 * developer's own project, whichever server the user picks, so the events go straight to Sentry (the CSP already
 * lets the window connect to https). Faro is the web's: the app has no collector.
 */
function telemetryFromBuild(env: ImportMetaEnv): TelemetryConfig {
  return {
    app: 'desktop',
    environment: env.VITE_SENTRY_ENVIRONMENT || env.MODE,
    release: `${RELEASE_NAME}@${env.VITE_APP_VERSION}`,
    sentry: env.VITE_SENTRY_DSN ? { dsn: env.VITE_SENTRY_DSN } : null,
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
  /** The server the user chose before, or null. */
  server: string | null
  /** Whether the system can share the sound of applications (Linux with PipeWire). */
  appAudio: boolean
}

/**
 * The desktop host. Its video capture is the Chromium inside Electron (the main process answers the request); the
 * sound of the applications the user picks comes through a virtual microphone the main process makes. The user
 * picks the server, which the main process keeps between runs and uses for the images and for the cookie. The
 * session is a cookie, as on the web: the main process makes the cookie of the server travel between sites.
 */
function createDesktopPlatform({ bridge, server, appAudio }: DesktopPlatformOptions): Platform {
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
      chooser: {
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

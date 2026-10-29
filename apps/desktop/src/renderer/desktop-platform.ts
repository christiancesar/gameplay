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

import { openSystemAudioTrack, type SystemAudioTrack } from './system-audio-track'

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
    logs: (env.VITE_APP_ENV || env.MODE) !== 'production',
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
  /** Whether the app lists the screens and windows itself (Windows, X11); on Wayland the system picker chooses. */
  listSources: boolean
  /** Whether the system can share its sound without the app's own (Windows, with the capture helper). */
  systemAudio: boolean
}

/**
 * The desktop host. Its video capture is the Chromium inside Electron (the main process answers the request, with
 * the source the user picked in the dialog where the app lists them); the
 * sound of the applications the user picks comes through a virtual microphone the main process makes. The user
 * picks the server, which the main process keeps between runs and uses for the images and for the cookie; a
 * build tied to a server (`VITE_SERVER_URL`) has no choice to offer. The session is a cookie, as on the web: the main process makes the cookie of the server travel between sites.
 */
function createDesktopPlatform({
  bridge,
  server,
  serverFixed,
  appAudio,
  listSources,
  systemAudio,
}: DesktopPlatformOptions): Platform {
  let chosen = server
  let systemAudioTrack: SystemAudioTrack | null = null
  return {
    kind: 'desktop',
    capabilities: {
      listSources,
      appAudio,
      globalHotkeys: false,
      ...audioCapabilitiesOf(navigator as unknown as CapturePlatformSource),
      // Never the call: the sound that goes is the computer's without this app, and on Windows, for a window, that of
      // the application that owns it.
      systemAudioWithoutApp: systemAudio || appAudio,
      windowAudio: systemAudio || (appAudio && listSources),
    },
    capture: {
      listSources: async () => (listSources ? bridge['capture:list-sources']() : []),
      start: async ({ options, sourceId, audioApps }) => {
        // The page cannot hand a source to `getDisplayMedia`: the main process answers it, so it is told first.
        if (listSources) await bridge['capture:select-source'](sourceId)
        if (systemAudio && options.audio) {
          // The sound of the computer without the app (the call plays inside it), through the capture helper.
          const video = await acquireScreen({ ...options, audio: false })
          if (!video.ok) return video
          // A window carries the sound of its application; a screen, that of the computer without this app.
          const scope = sourceId?.startsWith('window:')
            ? ({ scope: 'window', sourceId } as const)
            : ({ scope: 'system' } as const)
          const opened = await openSystemAudioTrack(bridge, scope)
          if (!opened) return video
          systemAudioTrack?.close()
          systemAudioTrack = opened
          video.capture.stream.addTrack(opened.track)
          return { ok: true, capture: { ...video.capture, audio: opened.track } }
        }
        // Linux: the sound is the applications' that the user chose (a setting for later), or else the computer's
        // without this app, so the call never goes back to the viewers. Either way it comes through a virtual microphone.
        const apps = appAudio ? (audioApps ?? []) : []
        if (!appAudio || (apps.length === 0 && !options.audio)) return acquireScreen(options)
        // The video without audio of its own; the sound is the applications' one, added below.
        const video = await acquireScreen({ ...options, audio: false })
        if (!video.ok) return video
        const shared = await bridge['audio:share'](
          apps.length > 0
            ? { mode: 'apps', apps: [...apps] }
            : sourceId?.startsWith('window:')
              ? { mode: 'window', sourceId }
              : { mode: 'system' },
        )
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
        systemAudioTrack?.close()
        systemAudioTrack = null
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

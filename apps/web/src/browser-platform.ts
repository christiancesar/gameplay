import {
  acquireScreen,
  audioCapabilitiesOf,
  stopScreen,
  type CapturePlatformSource,
  type GetDisplayMedia,
  type Platform,
  type TelemetryConfig,
} from '@gameplay/client/platform'

type BrowserPlatformDeps = {
  /** Replaces `navigator.mediaDevices.getDisplayMedia`, for specs. */
  getDisplayMedia?: GetDisplayMedia
  /** Replaces the `navigator` the capabilities are read from. */
  readBrowser?: () => CapturePlatformSource
  /** Replaces what the build was given, for specs. */
  telemetry?: TelemetryConfig
}

/** Vite bakes the `VITE_*` values of the web's env file into the build; empty ones keep that destination off. */
function telemetryFromBuild(env: ImportMetaEnv): TelemetryConfig {
  return {
    app: 'web',
    environment: env.VITE_SENTRY_ENVIRONMENT || env.MODE,
    release: env.VITE_SENTRY_RELEASE || '',
    sentry: env.VITE_SENTRY_DSN ? { dsn: env.VITE_SENTRY_DSN, tunnel: env.VITE_SENTRY_TUNNEL || undefined } : null,
    faro: env.VITE_FARO_URL ? { url: env.VITE_FARO_URL } : null,
  }
}

/**
 * The web: the picker is the browser's own, so the app lists no sources; what it can share as audio follows the
 * rules for the browser and system; the API is on the page's own origin and the session is a cookie.
 */
function createBrowserPlatform({
  getDisplayMedia,
  readBrowser = () => navigator as unknown as CapturePlatformSource,
  telemetry = telemetryFromBuild(import.meta.env),
}: BrowserPlatformDeps = {}): Platform {
  return {
    kind: 'browser',
    capabilities: {
      listSources: false,
      appAudio: false,
      systemAudioWithoutApp: false,
      globalHotkeys: false,
      ...audioCapabilitiesOf(readBrowser()),
    },
    capture: {
      listSources: async () => [],
      // A browser has no source to pick by id: `sourceId` is for hosts that list them.
      start: ({ options }) => acquireScreen(options, getDisplayMedia),
      stop: stopScreen,
      listAudioApps: async () => [],
    },
    server: { baseUrl: () => '' },
    telemetry,
  }
}

export { createBrowserPlatform, telemetryFromBuild }

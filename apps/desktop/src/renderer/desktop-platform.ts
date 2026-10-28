import {
  acquireScreen,
  audioCapabilitiesOf,
  type CapturePlatformSource,
  type Platform,
} from '@gameplay/client/platform'

// Until the next ticket moves it to the main process, the chosen server is kept in the storage of the page.
const SERVER_KEY = 'gameplay.server'

function readServer(): string | null {
  try {
    return localStorage.getItem(SERVER_KEY)
  } catch {
    return null
  }
}

/**
 * The desktop host. For now its capture is the Chromium inside Electron (the main process answers the request),
 * so the audio it can share follows the same rules as a browser; the user picks the server; and the session is a
 * cookie, as on the web: the main process makes the cookie of the server travel between sites.
 */
function createDesktopPlatform(): Platform {
  let server = readServer()
  return {
    kind: 'desktop',
    capabilities: {
      listSources: false,
      globalHotkeys: false,
      ...audioCapabilitiesOf(navigator as unknown as CapturePlatformSource),
    },
    capture: {
      listSources: async () => [],
      start: ({ options }) => acquireScreen(options),
    },
    server: {
      baseUrl: () => server ?? '',
      chooser: {
        current: () => server,
        choose: (origin) => {
          server = origin
          localStorage.setItem(SERVER_KEY, origin)
        },
      },
    },
  }
}

export { createDesktopPlatform }

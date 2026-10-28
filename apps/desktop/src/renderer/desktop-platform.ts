import {
  acquireScreen,
  audioCapabilitiesOf,
  type CapturePlatformSource,
  type Platform,
} from '@gameplay/client/platform'
import type { DesktopBridge } from '@gameplay/desktop-bridge/bridge'

/**
 * The desktop host. For now its capture is the Chromium inside Electron (the main process answers the request),
 * so the audio it can share follows the same rules as a browser. The user picks the server, which the main
 * process keeps between runs and uses for the images and for the cookie. The session is a cookie, as on the web:
 * the main process makes the cookie of the server travel between sites.
 */
function createDesktopPlatform({ bridge, server }: { bridge: DesktopBridge; server: string | null }): Platform {
  let chosen = server
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
      baseUrl: () => chosen ?? '',
      chooser: {
        current: () => chosen,
        choose: async (origin) => {
          await bridge['server:set-url'](origin)
          chosen = origin
        },
      },
    },
  }
}

export { createDesktopPlatform }

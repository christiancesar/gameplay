import {
  acquireScreen,
  audioCapabilitiesOf,
  type CapturePlatformSource,
  type GetDisplayMedia,
  type Platform,
} from '@gameplay/client/platform'

type BrowserPlatformDeps = {
  /** Replaces `navigator.mediaDevices.getDisplayMedia`, for specs. */
  getDisplayMedia?: GetDisplayMedia
  /** Replaces the `navigator` the capabilities are read from. */
  readBrowser?: () => CapturePlatformSource
}

/**
 * The web: the picker is the browser's own, so the app lists no sources; what it can share as audio follows the
 * rules for the browser and system; the API is on the page's own origin and the session is a cookie.
 */
function createBrowserPlatform({
  getDisplayMedia,
  readBrowser = () => navigator as unknown as CapturePlatformSource,
}: BrowserPlatformDeps = {}): Platform {
  return {
    kind: 'browser',
    capabilities: { listSources: false, globalHotkeys: false, ...audioCapabilitiesOf(readBrowser()) },
    capture: {
      listSources: async () => [],
      // A browser has no source to pick by id: `sourceId` is for hosts that list them.
      start: ({ options }) => acquireScreen(options, getDisplayMedia),
    },
    server: { baseUrl: () => '' },
  }
}

export { createBrowserPlatform }

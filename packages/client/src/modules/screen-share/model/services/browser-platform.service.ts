import { browserEnvironment } from '@/modules/browser-support/model/services/browser-environment.service'
import { acquireScreen, type GetDisplayMedia } from '@/shared/media/screen-capture'
import type { Platform } from '@/shared/platform/platform'

import { audioSupportFor, canShareAudio } from '../rules/audio-support'
import { type CapturePlatformSource, detectCapturePlatform } from '../rules/capture-platform'

type BrowserPlatformDeps = {
  /** Replaces `navigator.mediaDevices.getDisplayMedia`, for specs and Storybook. */
  getDisplayMedia?: GetDisplayMedia
  /** Replaces the `navigator` the capabilities are read from. */
  readBrowser?: () => CapturePlatformSource
}

/**
 * The platform of any browser: the picker is the browser's own, so the app lists no sources, and what it can
 * share as audio follows the rules for the browser and system it runs on.
 */
function createBrowserPlatform({
  getDisplayMedia,
  readBrowser = () => browserEnvironment.readBrowser(),
}: BrowserPlatformDeps = {}): Platform {
  const environment = detectCapturePlatform(readBrowser())
  return {
    kind: 'browser',
    capabilities: {
      listSources: false,
      windowAudio: canShareAudio(audioSupportFor('window', environment)),
      systemAudio: canShareAudio(audioSupportFor('screen', environment)),
      globalHotkeys: false,
    },
    capture: {
      listSources: async () => [],
      // A browser has no source to pick by id: `sourceId` is for hosts that list them.
      start: ({ options }) => acquireScreen(options, getDisplayMedia),
    },
  }
}

export { createBrowserPlatform }
export type { BrowserPlatformDeps }

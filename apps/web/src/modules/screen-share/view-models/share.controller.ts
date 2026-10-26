import { browserEnvironment } from '@/modules/browser-support/model/services/browser-environment.service'
import { realtime } from '@/modules/realtime/model/services/realtime.service'
import { type CapturePlatform, detectCapturePlatform } from '@/modules/screen-share/model/rules/capture-platform'
import { ShareSession } from '@/modules/screen-share/model/services/share-session.service'
import { WatchSession } from '@/modules/screen-share/model/services/watch-session.service'
import { voiceController } from '@/modules/rooms/view-models/voice.controller'
import { acquireScreen, stopScreen } from '@/shared/media/screen-capture'

import { useShareStore } from './stores/share.store'
import { useWatchStore } from './stores/watch.store'

let share: ShareSession | undefined
let watch: WatchSession | undefined
let platform: CapturePlatform | undefined

/** Browser and system, read once: they decide which screen audio can be captured. */
function getPlatform(): CapturePlatform {
  platform ??= detectCapturePlatform(browserEnvironment.readBrowser())
  return platform
}

/** Built on first use, so importing this module never touches the browser media APIs. */
function getShare(): ShareSession {
  if (!share) {
    share = new ShareSession({
      realtime,
      store: useShareStore,
      subscribeMedia: voiceController.subscribeMedia,
      acquireScreen: (options) => acquireScreen(options),
      stopScreen,
    })
    share.attach()
  }
  return share
}

function getWatch(): WatchSession {
  if (!watch) {
    watch = new WatchSession({ realtime, store: useWatchStore, subscribeMedia: voiceController.subscribeMedia })
    watch.attach()
  }
  return watch
}

/**
 * Entry point of screen share and screen watching for ViewModels. Both follow the voice call: they exist
 * while it does, so leaving the room (or the layout) ends them with it.
 */
const shareController = {
  platform: getPlatform,
  start: (...args: Parameters<ShareSession['start']>) => getShare().start(...args),
  stop: () => getShare().stop(),
  updateQuality: (...args: Parameters<ShareSession['updateQuality']>) => getShare().updateQuality(...args),
  dismissNotice: () => getShare().dismissNotice(),
  watch: (streamerId: string) => getWatch().watch(streamerId),
  stopWatching: () => getWatch().stop(),
  setStreamVolume: (volume: number) => getWatch().setVolume(volume),
  dismissWatchFailure: () => getWatch().dismissFailure(),
}

export { shareController }

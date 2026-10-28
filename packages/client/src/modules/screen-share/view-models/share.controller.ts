import type { StreamQualityLevel } from '@gameplay/contracts'

import { browserEnvironment } from '@/modules/browser-support/model/services/browser-environment.service'
import { realtime } from '@/modules/realtime/model/services/realtime.service'
import { toShareStartMeasurement } from '@/modules/screen-share/model/mappers/share-start.mapper'
import { type CapturePlatform, detectCapturePlatform } from '@/modules/screen-share/model/rules/capture-platform'
import { ShareSession } from '@/modules/screen-share/model/services/share-session.service'
import { WatchSession } from '@/modules/screen-share/model/services/watch-session.service'
import { voiceController } from '@/modules/rooms/view-models/voice.controller'
import { monitoring } from '@/shared/lib/monitoring'
import { createBrowserMediaStream, createBrowserPeerConnection } from '@/shared/media/browser-media'
import { SfuConnection, type SfuConnectionDeps } from '@/shared/media/sfu-connection'
import { currentPlatform } from '@/shared/platform/current-platform'
import { sfuSignaling } from '@/modules/screen-share/model/services/sfu.service'
import { useVoiceStore } from '@/modules/rooms/view-models/stores/voice.store'

import { useShareStore } from './stores/share.store'
import { useWatchStore } from './stores/watch.store'

/** Cloudflare's SFU is anycast; its STUN is enough to reach it. */
const sfuDeps: SfuConnectionDeps = {
  signaling: sfuSignaling,
  createPeerConnection: createBrowserPeerConnection,
  iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
}

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
      // The host decides how a screen is captured: the browser's picker on the web, its own on the desktop.
      acquireScreen: (options, audioApps) => currentPlatform().capture.start({ options, sourceId: null, audioApps }),
      stopScreen: (capture) => currentPlatform().capture.stop(capture),
      publishToSfu: (tracks) => SfuConnection.publish(sfuDeps, tracks),
      report: monitoring.measuring
        ? (start) => monitoring.measure(toShareStartMeasurement(start, getPlatform()))
        : undefined,
    })
    share.attach()
  }
  return share
}

function getWatch(): WatchSession {
  if (!watch) {
    watch = new WatchSession({
      realtime,
      store: useWatchStore,
      subscribeMedia: voiceController.subscribeMedia,
      streamModeOf: (userId) =>
        useVoiceStore.getState().participants.find((participant) => participant.userId === userId)?.streamMode ?? null,
      watchFromSfu: (streamerId, layer, onTrack) => SfuConnection.watch(sfuDeps, streamerId, layer, onTrack),
      createMediaStream: createBrowserMediaStream,
    })
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
  setStreamQuality: (level: StreamQualityLevel) => getWatch().setLevel(level),
  dismissWatchFailure: () => getWatch().dismissFailure(),
}

export { shareController }

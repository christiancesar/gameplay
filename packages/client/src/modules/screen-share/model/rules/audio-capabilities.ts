import { audioSupportFor, canShareAudio } from './audio-support'
import { type CapturePlatformSource, detectCapturePlatform } from './capture-platform'

/**
 * The screen audio a browser can share here, read from its Client Hints and user agent: what a host with a
 * browser inside (the web, the desktop app) reports as `windowAudio` and `systemAudio`.
 */
function audioCapabilitiesOf(source: CapturePlatformSource): { windowAudio: boolean; systemAudio: boolean } {
  const environment = detectCapturePlatform(source)
  return {
    windowAudio: canShareAudio(audioSupportFor('window', environment)),
    systemAudio: canShareAudio(audioSupportFor('screen', environment)),
  }
}

export { audioCapabilitiesOf }

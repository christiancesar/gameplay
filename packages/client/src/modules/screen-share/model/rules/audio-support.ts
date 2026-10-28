import type { ShareSource } from '../entities/share'
import type { CapturePlatform } from './capture-platform'

/**
 * What the browser can capture as screen audio here.
 * `apps`: the host shares the sound of chosen applications, whichever source. `supported`: it works. `recentMac`: needs macOS 14.2 or newer. `windowUnsupported`: never the audio of a
 * single window. `tabOnly`: only a tab has audio on this system. `browserUnsupported`: no screen audio.
 */
type AudioSupport = 'apps' | 'supported' | 'recentMac' | 'windowUnsupported' | 'tabOnly' | 'browserUnsupported'

/** First Chromium with system audio on macOS. */
const CHROMIUM_WITH_MAC_AUDIO = 141

function audioSupportFor(source: ShareSource, platform: CapturePlatform): AudioSupport {
  if (platform.engine !== 'chromium') return 'browserUnsupported'
  if (source === 'tab') return 'supported'
  if (source === 'window') return 'windowUnsupported'
  if (platform.os === 'windows' || platform.os === 'chromeos') return 'supported'
  if (platform.os === 'mac' && platform.chromiumMajor >= CHROMIUM_WITH_MAC_AUDIO) return 'recentMac'
  return 'tabOnly'
}

/** Where the browser gives no screen audio the switch is locked: only the microphone goes. */
function canShareAudio(support: AudioSupport): boolean {
  return support === 'apps' || support === 'supported' || support === 'recentMac'
}

export { CHROMIUM_WITH_MAC_AUDIO, audioSupportFor, canShareAudio }
export type { AudioSupport }

import type { ShareSource } from '../entities/share'
import type { CapturePlatform } from './capture-platform'

/**
 * What the browser can capture as screen audio here.
 * `supported`: it works. `recentMac`: needs macOS 14.2 or newer. `windowMaybe`: Chromium 141+ may offer the
 * window's own audio. `tabOnly`: only a tab has audio on this system. `browserUnsupported`: no screen audio.
 */
type AudioSupport = 'supported' | 'recentMac' | 'windowMaybe' | 'tabOnly' | 'browserUnsupported'

/** First Chromium with system audio on macOS and the `windowAudio` hint. */
const CHROMIUM_WITH_WINDOW_AUDIO = 141

function audioSupportFor(source: ShareSource, platform: CapturePlatform): AudioSupport {
  if (platform.engine !== 'chromium') return 'browserUnsupported'
  if (source === 'tab') return 'supported'
  const recent = platform.chromiumMajor >= CHROMIUM_WITH_WINDOW_AUDIO
  if (source === 'window') return recent ? 'windowMaybe' : 'tabOnly'
  if (platform.os === 'windows' || platform.os === 'chromeos') return 'supported'
  if (platform.os === 'mac' && recent) return 'recentMac'
  return 'tabOnly'
}

/** The cases where asking for audio most likely brings none: the dialog warns. */
function isAudioUnlikely(support: AudioSupport): boolean {
  return support === 'tabOnly' || support === 'browserUnsupported'
}

export { CHROMIUM_WITH_WINDOW_AUDIO, audioSupportFor, isAudioUnlikely }
export type { AudioSupport }

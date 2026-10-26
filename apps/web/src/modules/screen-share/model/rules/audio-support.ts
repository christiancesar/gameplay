import type { ShareSource } from '../entities/share'

type AudioSupport = 'supported' | 'windowsOnly' | 'unsupported'

/** Tabs share audio everywhere, the whole screen only on Windows, a single window never. */
function audioSupportFor(source: ShareSource): AudioSupport {
  if (source === 'tab') return 'supported'
  if (source === 'screen') return 'windowsOnly'
  return 'unsupported'
}

export { audioSupportFor }
export type { AudioSupport }

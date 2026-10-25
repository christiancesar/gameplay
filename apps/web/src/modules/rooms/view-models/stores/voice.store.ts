import { create } from 'zustand'

import { idleVoice, type VoiceConnection, type VoiceSnapshot } from '@/modules/rooms/model/entities/voice-state'

/**
 * The voice call as the UI sees it. `VoiceSession` (one per tab, outside React) writes it; ViewModels
 * only read. It lives here, not in a component, so the call survives going to the Hub (F6).
 */
type VoiceState = VoiceSnapshot & {
  /** Kept for callers that only need to set the room (specs). The session sets it while joining. */
  setConnection: (connection: VoiceConnection | null) => void
}

const useVoiceStore = create<VoiceState>()((set) => ({
  ...idleVoice,
  setConnection: (connection) => set({ connection }),
}))

export { useVoiceStore }
export type { VoiceConnection }

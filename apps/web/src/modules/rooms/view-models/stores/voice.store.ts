import { create } from 'zustand'

/** Room the user is connected to. Lives outside the URL: the logo goes back to the Hub without leaving the room (F6). */
type VoiceConnection = { serverId: string; roomId: string }

type VoiceState = {
  connection: VoiceConnection | null
  setConnection: (connection: VoiceConnection | null) => void
}

// Stub until FE-09: only tracks which room the user is in. Media, mute and deafen come with the voice ticket.
const useVoiceStore = create<VoiceState>()((set) => ({
  connection: null,
  setConnection: (connection) => set({ connection }),
}))

export { useVoiceStore }
export type { VoiceConnection }

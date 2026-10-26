import type { Participant } from '@gameplay/contracts'

/** Room the user is connected to. Lives outside the URL: the logo goes back to the Hub without leaving the room (F6). */
type VoiceConnection = { serverId: string; roomId: string }

/** Media path with one remote person. */
type PeerConnectionStatus = 'connecting' | 'connected' | 'failed'

/**
 * `joining`: asking for the microphone and the seat. `reconnecting`: the socket dropped, the call keeps
 * running and the seat is held by the API for 30 s.
 */
type VoiceStatus = 'idle' | 'joining' | 'connected' | 'reconnecting'

/** Why the call ended or could not start, for a toast. The room itself is already gone. */
type VoiceNotice = 'other-tab' | 'room-deleted' | 'join-failed' | 'reconnect-failed'

type VoiceSnapshot = {
  connection: VoiceConnection | null
  status: VoiceStatus
  /** Who is in the room, as the API reports them (mute and deafen included). */
  participants: Participant[]
  peers: Record<string, PeerConnectionStatus>
  speaking: Record<string, boolean>
  /** Volume of each person for me, in percent (0 to 200). Missing means 100. */
  volumes: Record<string, number>
  /** The mute the user chose. Deafen also silences the microphone without changing this. */
  muted: boolean
  deafened: boolean
  /** No microphone: the call is listen only. */
  micDenied: boolean
  notice: VoiceNotice | null
}

/** The part of a zustand store the session needs. */
type VoiceStateStore = {
  getState(): VoiceSnapshot
  setState(partial: Partial<VoiceSnapshot>): void
}

const idleVoice: VoiceSnapshot = {
  connection: null,
  status: 'idle',
  participants: [],
  peers: {},
  speaking: {},
  volumes: {},
  muted: false,
  deafened: false,
  micDenied: false,
  notice: null,
}

export { idleVoice }
export type { PeerConnectionStatus, VoiceConnection, VoiceNotice, VoiceSnapshot, VoiceStateStore, VoiceStatus }

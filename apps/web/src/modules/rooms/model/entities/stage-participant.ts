type ParticipantConnection = 'connecting' | 'connected' | 'failed'

type StageParticipant = {
  id: string
  name: string
  avatarUrl?: string
  isMe: boolean
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  isLive: boolean
  connection: ParticipantConnection
  /** Local volume of this participant, from 0 to 200 (%). */
  volume: number
}

export type { ParticipantConnection, StageParticipant }

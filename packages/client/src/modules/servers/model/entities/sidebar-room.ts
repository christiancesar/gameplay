export type SidebarRoom = {
  id: string
  name: string
  participants: readonly SidebarParticipant[]
}

export type SidebarParticipant = {
  id: string
  name: string
  avatarUrl?: string
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  isLive: boolean
}

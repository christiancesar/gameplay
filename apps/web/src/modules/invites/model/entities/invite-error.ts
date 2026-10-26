export type InviteError = 'expired' | 'exhausted' | 'requestPending' | 'notFound'

export type InviteLandingState =
  | { status: 'signedOut'; server: InviteServer }
  | { status: 'confirm'; server: InviteServer; isJoining: boolean }
  | { status: 'alreadyMember'; server: InviteServer }
  | { status: 'error'; error: InviteError }

export type InviteServer = { name: string; iconUrl?: string; memberCount: number; isFull: boolean }

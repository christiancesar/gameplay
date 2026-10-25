import type { ServerRole } from '@gameplay/contracts'

// The server the servers and memberships unit tests start with: "Squad",
// created by "owner" with the first room "Lobby", plus an admin and a member.
export const SEED_SERVER = { ownerId: 'owner', name: 'Squad', defaultRoomName: 'Lobby' }

export const SEED_MEMBERS: { userId: string; role: Exclude<ServerRole, 'owner'> }[] = [
  { userId: 'admin', role: 'admin' },
  { userId: 'member', role: 'member' },
]

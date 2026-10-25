import type { ServerRole } from '@gameplay/contracts'

// The memberships unit tests start with the server "Squad", created by
// "owner", plus an admin and a member.
export const SEED_SERVER = { name: 'Squad', ownerId: 'owner' }

export const SEED_MEMBERS: { userId: string; role: Exclude<ServerRole, 'owner'> }[] = [
  { userId: 'admin', role: 'admin' },
  { userId: 'member', role: 'member' },
]

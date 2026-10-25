import type { ServerRole } from '@gameplay/contracts'
import type { RoomRecord, ServerRecord } from '../../servers/domain/server'

// The world the realtime unit tests start from: two servers; "ana" belongs to
// both, "bia" and "caio" only to s1. Rooms r1 and r2 are in s1, r3 in s2.
const server = (id: string): ServerRecord => ({
  id,
  name: 'Turbex',
  description: null,
  iconKey: null,
  coverKey: null,
  autoApprove: false,
  ownerId: 'ana',
  createdAt: new Date(0),
})

export const SEED_SERVERS: ServerRecord[] = [server('s1'), server('s2')]

export const SEED_MEMBERS: { serverId: string; userId: string; role: ServerRole }[] = [
  { serverId: 's1', userId: 'ana', role: 'owner' },
  { serverId: 's2', userId: 'ana', role: 'owner' },
  { serverId: 's1', userId: 'bia', role: 'member' },
  { serverId: 's1', userId: 'caio', role: 'member' },
]

export const SEED_ROOMS: RoomRecord[] = [
  { id: 'r1', serverId: 's1', name: 'Room 1', position: 0 },
  { id: 'r2', serverId: 's1', name: 'Room 2', position: 1 },
  { id: 'r3', serverId: 's2', name: 'Room 1', position: 0 },
]

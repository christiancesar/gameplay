import type { ServerDetail, ServerSummary } from '@gameplay/contracts'

const ownedServer: ServerSummary = { id: 's1', name: 'Turbex', iconUrl: null, role: 'owner' }
const joinedServer: ServerSummary = { id: 's2', name: 'Clan Zero', iconUrl: '/icons/s2.webp', role: 'member' }

const createdServer: ServerDetail = {
  id: 's-new',
  name: 'My server',
  description: null,
  iconUrl: null,
  coverUrl: null,
  autoApprove: false,
  ownerId: 'u1',
  role: 'owner',
  memberCount: 1,
  limits: { maxMembers: 10, maxRooms: 2 },
  rooms: [{ id: 'r1', name: 'hub.defaultRoomName', position: 0 }],
}

export { createdServer, joinedServer, ownedServer }

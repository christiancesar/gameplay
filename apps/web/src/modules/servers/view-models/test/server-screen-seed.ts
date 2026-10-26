import type { ServerDetail, ServerMember } from '@gameplay/contracts'

const member = (
  id: string,
  username: string,
  role: ServerMember['role'],
  image: string | null = null,
): ServerMember => ({
  user: { id, username, displayUsername: null, image },
  role,
  joinedAt: '2026-01-01T00:00:00.000Z',
  invite: null,
})

const ownerMember = member('u1', 'turbex', 'owner', '/avatars/u1.webp')
const adminMember = member('u3', 'bruna', 'admin')
const anaMember = member('u2', 'ana', 'member')
const carlosMember = member('u4', 'carlos', 'member')

const members: ServerMember[] = [carlosMember, anaMember, adminMember, ownerMember]

const serverDetail: ServerDetail = {
  id: 's1',
  name: 'Turbex',
  description: null,
  iconUrl: null,
  coverUrl: '/covers/s1.webp',
  autoApprove: false,
  ownerId: 'u1',
  role: 'owner',
  memberCount: 4,
  limits: { maxMembers: 10, maxRooms: 3 },
  rooms: [
    { id: 'r2', name: 'Raid', position: 1 },
    { id: 'r1', name: 'Lobby', position: 0 },
  ],
  pendingJoinRequests: 2,
}

const memberDetail: ServerDetail = { ...serverDetail, role: 'member', pendingJoinRequests: null }

export { adminMember, anaMember, carlosMember, memberDetail, members, ownerMember, serverDetail }

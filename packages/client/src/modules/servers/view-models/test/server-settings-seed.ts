import type { JoinRequest, RoomOccupancy, ServerDetail, ServerInvite, ServerMember } from '@gameplay/contracts'

const user = (id: string, username: string, image: string | null = null) => ({
  id,
  username,
  displayUsername: null,
  image,
})

const ownerMember: ServerMember = {
  user: user('u1', 'turbex', '/avatars/u1.webp'),
  role: 'owner',
  joinedAt: '2026-01-01T00:00:00.000Z',
  invite: null,
}
const adminMember: ServerMember = {
  user: { ...user('u3', 'bruna'), displayUsername: 'Bruna' },
  role: 'admin',
  joinedAt: '2026-01-03T00:00:00.000Z',
  invite: { id: 'i9', createdBy: { id: 'u1', username: 'turbex' } },
}
const plainMember: ServerMember = {
  user: user('u2', 'ana'),
  role: 'member',
  joinedAt: '2026-01-02T00:00:00.000Z',
  invite: { id: 'i8', createdBy: { id: 'u3', username: 'bruna' } },
}

const settingsMembers: ServerMember[] = [plainMember, adminMember, ownerMember]

const settingsDetail: ServerDetail = {
  id: 's1',
  name: 'Turbex',
  description: 'Dota on Fridays.',
  iconUrl: '/icons/s1.webp',
  coverUrl: null,
  autoApprove: false,
  ownerId: 'u1',
  role: 'owner',
  memberCount: 3,
  limits: { maxMembers: 4, maxRooms: 2 },
  rooms: [
    { id: 'r2', name: 'Raid', position: 1 },
    { id: 'r1', name: 'Lobby', position: 0 },
  ],
  pendingJoinRequests: 1,
}

const adminDetail: ServerDetail = { ...settingsDetail, role: 'admin' }
const memberDetail: ServerDetail = { ...settingsDetail, role: 'member', pendingJoinRequests: null }
const fullDetail: ServerDetail = { ...settingsDetail, memberCount: 4 }

const invite = (id: string, code: string, overrides: Partial<ServerInvite> = {}): ServerInvite => ({
  id,
  code,
  status: 'active',
  createdBy: { id: 'u1', username: 'turbex' },
  createdAt: '2026-03-01T10:00:00.000Z',
  expiresAt: '2099-03-01T11:00:00.000Z',
  usedBy: null,
  usedAt: null,
  revokedAt: null,
  ...overrides,
})

const activeInvite = invite('i1', 'JH34SD32')
const usedInvite = invite('i2', 'AB23CD45', {
  status: 'used',
  createdAt: '2026-03-01T09:00:00.000Z',
  usedBy: { id: 'u2', username: 'ana' },
  usedAt: '2026-03-01T09:10:00.000Z',
})
const revokedInvite = invite('i3', 'ZX98CV76', {
  status: 'revoked',
  createdAt: '2026-03-01T08:00:00.000Z',
  revokedAt: '2026-03-01T08:05:00.000Z',
})

const settingsInvites: ServerInvite[] = [usedInvite, activeInvite, revokedInvite]

const joinRequest: JoinRequest = {
  id: 'jr1',
  user: { id: 'u5', username: 'carlos', displayUsername: 'Carlos', image: '/avatars/u5.webp' },
  invitedBy: { id: 'u1', username: 'turbex' },
  createdAt: '2026-03-02T10:00:00.000Z',
}
const olderJoinRequest: JoinRequest = {
  id: 'jr0',
  user: { id: 'u6', username: 'dani', displayUsername: null, image: null },
  invitedBy: { id: 'u3', username: 'bruna' },
  createdAt: '2026-03-02T09:00:00.000Z',
}

const lobbyOccupancy: RoomOccupancy = {
  roomId: 'r1',
  participants: [
    { userId: 'u1', muted: false, deafened: false, streaming: null, streamMode: null },
    { userId: 'u2', muted: false, deafened: false, streaming: null, streamMode: null },
  ],
}

export {
  activeInvite,
  adminDetail,
  adminMember,
  fullDetail,
  joinRequest,
  lobbyOccupancy,
  memberDetail,
  olderJoinRequest,
  ownerMember,
  plainMember,
  revokedInvite,
  settingsDetail,
  settingsInvites,
  settingsMembers,
  usedInvite,
}

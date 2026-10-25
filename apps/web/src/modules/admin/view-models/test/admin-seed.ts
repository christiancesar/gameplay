import type {
  AdminServer,
  AdminServerDetail,
  AdminSession,
  AdminUser,
  PlatformSettings,
  RegistrationInvite,
  ServerMember,
} from '@gameplay/contracts'

const adminUser: AdminUser = {
  id: 'u1',
  username: 'kisnaider',
  displayUsername: 'Kisnaider',
  email: 'kis@gameplay.local',
  image: null,
  role: 'user',
  suspended: false,
  twoFactorEnabled: false,
  online: true,
  maxServersOverride: null,
  effectiveMaxServers: 1,
  ownedServerCount: 1,
  sessionCount: 1,
  createdAt: '2026-10-20T10:00:00.000Z',
}
const suspendedUser: AdminUser = {
  ...adminUser,
  id: 'u2',
  username: 'marreta',
  displayUsername: 'Marreta',
  email: 'marreta@gameplay.local',
  suspended: true,
  online: false,
  sessionCount: 0,
  ownedServerCount: 0,
}

const adminSession: AdminSession = {
  id: 's1',
  ipAddress: '187.64.12.201',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36',
  createdAt: '2026-10-25T09:00:00.000Z',
  lastActiveAt: '2026-10-25T11:00:00.000Z',
  expiresAt: '2026-11-01T09:00:00.000Z',
}

const adminServer: AdminServer = {
  id: 'sv1',
  name: 'Turbex',
  iconUrl: null,
  owner: { id: 'u1', username: 'shinigame' },
  memberCount: 6,
  roomCount: 2,
  maxMembersOverride: null,
  maxRoomsOverride: null,
  effectiveMaxMembers: 10,
  effectiveMaxRooms: 2,
  createdAt: '2026-10-20T10:00:00.000Z',
}

const adminServerMember: ServerMember = {
  user: { id: 'u2', username: 'lua', displayUsername: 'Lua', image: null },
  role: 'member',
  joinedAt: '2026-10-22T10:00:00.000Z',
  invite: { id: 'i1', createdBy: { id: 'u1', username: 'shinigame' } },
}

const adminServerDetail: AdminServerDetail = {
  ...adminServer,
  rooms: [],
  members: [adminServerMember],
}

const platformSettings: PlatformSettings = {
  maxServersPerUser: 1,
  maxMembersPerServer: 10,
  maxRoomsPerServer: 2,
  minChromiumVersion: 130,
}

const activeInvite: RegistrationInvite = {
  id: 'k1',
  suffix: 'X4P',
  status: 'active',
  createdAt: '2026-10-25T08:00:00.000Z',
  expiresAt: '2026-11-01T08:00:00.000Z',
  usedAt: null,
  usedBy: null,
}
const usedInvite: RegistrationInvite = {
  ...activeInvite,
  id: 'k2',
  suffix: 'M9Q',
  status: 'used',
  usedAt: '2026-10-25T09:00:00.000Z',
  usedBy: { id: 'u3', username: 'lua' },
}

const generatedInvite: RegistrationInvite = { ...activeInvite, id: 'k9', suffix: 'C34' }

export {
  activeInvite,
  adminServer,
  adminServerDetail,
  adminServerMember,
  adminSession,
  adminUser,
  generatedInvite,
  platformSettings,
  suspendedUser,
  usedInvite,
}

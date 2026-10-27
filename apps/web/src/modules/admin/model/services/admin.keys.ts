import type { AdminListQuery } from '@gameplay/contracts'

/** Query keys of the admin module. Every admin query lives under `admin`. */
const adminKeys = {
  all: ['admin'] as const,
  users: (query: AdminListQuery = {}) => [...adminKeys.all, 'users', query] as const,
  usersAll: () => [...adminKeys.all, 'users'] as const,
  userSessionsAll: () => [...adminKeys.all, 'user-sessions'] as const,
  userSessions: (userId: string) => [...adminKeys.all, 'user-sessions', userId] as const,
  devices: (query: AdminListQuery = {}) => [...adminKeys.all, 'devices', query] as const,
  userDevices: (userId: string) => [...adminKeys.all, 'user-devices', userId] as const,
  servers: (query: AdminListQuery = {}) => [...adminKeys.all, 'servers', query] as const,
  serversAll: () => [...adminKeys.all, 'servers'] as const,
  serverDetail: (serverId: string) => [...adminKeys.all, 'server-detail', serverId] as const,
  hardwareSummary: () => [...adminKeys.all, 'hardware-summary'] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
  registrationInvites: () => [...adminKeys.all, 'registration-invites'] as const,
  media: () => [...adminKeys.all, 'media'] as const,
  mediaImpact: (serverId: string | null) => [...adminKeys.all, 'media-impact', serverId] as const,
  serverMedia: (serverId: string) => [...adminKeys.all, 'server-media', serverId] as const,
}

export { adminKeys }

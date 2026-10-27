import { makeCollected } from '../../accounts/test/hardware-seed'
import type { AdminDeviceRecord, AdminUserRecord } from '../domain/admin-records'
import type { AccountSession } from '../providers/auth-accounts/auth-accounts.provider'

// The platform admin unit tests start with the admin, "ana" and "bia" (bia
// signed up last), each with a password, and two sessions for ana.
const user = (id: string, createdAt: number, role: 'user' | 'admin' = 'user'): AdminUserRecord => ({
  id,
  username: id,
  displayUsername: null,
  email: `${id}@example.com`,
  image: null,
  role,
  suspended: false,
  twoFactorEnabled: role === 'admin',
  maxServersOverride: null,
  ownedServerCount: 0,
  sessionCount: 0,
  createdAt: new Date(createdAt),
})

export const SEED_USERS: AdminUserRecord[] = [user('admin', 1, 'admin'), user('ana', 2), user('bia', 3)]

export const SEED_PASSWORDS: [userId: string, password: string][] = SEED_USERS.map(({ id }) => [id, `${id}-pass`])

const session = (id: string, createdAt: number): AccountSession => ({
  id,
  ipAddress: '203.0.113.7',
  userAgent: 'Chrome',
  createdAt: new Date(createdAt),
  lastActiveAt: new Date(createdAt + 5),
  expiresAt: new Date(99),
})

export const SEED_SESSIONS: [userId: string, sessions: AccountSession[]][] = [
  ['ana', [session('sess-1', 10), session('sess-2', 20)]],
]

// Hardware reports of the base: ana's laptop is the newest, bia's desktop the oldest.
export const SEED_DEVICES: AdminDeviceRecord[] = [
  {
    user: { id: 'bia', username: 'bia' },
    deviceId: 'desktop',
    collected: makeCollected(),
    manual: null,
    collectedAt: new Date(1),
  },
  {
    user: { id: 'ana', username: 'ana' },
    deviceId: 'laptop',
    collected: makeCollected(),
    manual: null,
    collectedAt: new Date(3),
  },
  {
    user: { id: 'ana', username: 'ana' },
    deviceId: 'phone',
    collected: makeCollected(),
    manual: null,
    collectedAt: new Date(2),
  },
]

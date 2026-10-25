import type { AdminUserRecord } from '../domain/admin-records'
import type { AccountSession } from '../providers/auth-accounts'

// The platform admin unit tests start with the admin, "ana" and "bia" (bia
// signed up last), each with a password, and one session for ana.
const user = (id: string, createdAt: number, role: 'user' | 'admin' = 'user'): AdminUserRecord => ({
  id,
  username: id,
  displayUsername: null,
  email: `${id}@example.com`,
  image: null,
  role,
  suspended: false,
  twoFactorEnabled: role === 'admin',
  createdAt: new Date(createdAt),
})

export const SEED_USERS: AdminUserRecord[] = [user('admin', 1, 'admin'), user('ana', 2), user('bia', 3)]

export const SEED_PASSWORDS: [userId: string, password: string][] = SEED_USERS.map(({ id }) => [id, `${id}-pass`])

export const SEED_SESSIONS: [userId: string, sessions: AccountSession[]][] = [
  [
    'ana',
    [{ id: 'sess-1', ipAddress: '203.0.113.7', userAgent: 'Chrome', createdAt: new Date(10), expiresAt: new Date(99) }],
  ],
]

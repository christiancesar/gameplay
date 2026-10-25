import { InMemoryPresenceStore } from '../../realtime/stores/in-memory/in-memory-presence.store'
import { FakeEventBus } from '../../servers/test/fakes'
import { InMemoryAdminUsersRepository } from '../repositories/in-memory/in-memory-admin-users.repository'
import { AdminUsersService } from '../services/admin-users.service'
import { ListUserSessionsUseCase } from '../use-cases/list-user-sessions.use-case'
import { ListUsersUseCase } from '../use-cases/list-users.use-case'
import { ReactivateUserUseCase } from '../use-cases/reactivate-user.use-case'
import { ResetUserPasswordUseCase } from '../use-cases/reset-user-password.use-case'
import { RevokeUserSessionsUseCase } from '../use-cases/revoke-user-sessions.use-case'
import { SuspendUserUseCase } from '../use-cases/suspend-user.use-case'
import { FakeAuthAccounts } from './fake-auth-accounts'
import { FixedPasswordGenerator } from './fixed-password-generator'
import { SEED_PASSWORDS, SEED_SESSIONS, SEED_USERS } from './platform-admin-seed'

// The user actions of the panel wired to in-memory fakes, over the seed.
export function makePlatformAdminContext() {
  const repository = new InMemoryAdminUsersRepository()
  repository.users.push(...SEED_USERS.map((user) => ({ ...user })))
  const accounts = new FakeAuthAccounts()
  for (const [userId, password] of SEED_PASSWORDS) accounts.passwords.set(userId, password)
  for (const [userId, sessions] of SEED_SESSIONS) accounts.sessions.set(userId, [...sessions])

  const presence = new InMemoryPresenceStore()
  const events = new FakeEventBus()
  const users = new AdminUsersService(repository)
  return {
    accounts,
    presence,
    events,
    listUsers: new ListUsersUseCase(repository, presence),
    listSessions: new ListUserSessionsUseCase(users, accounts),
    revokeSessions: new RevokeUserSessionsUseCase(users, accounts, events),
    suspend: new SuspendUserUseCase(users, accounts, events),
    reactivate: new ReactivateUserUseCase(users, accounts),
    resetPassword: new ResetUserPasswordUseCase(users, accounts, new FixedPasswordGenerator(), events),
  }
}

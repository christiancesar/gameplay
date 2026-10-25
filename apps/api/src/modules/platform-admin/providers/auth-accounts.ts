import { Injectable } from '@nestjs/common'
import { AuthService } from '@thallesp/nestjs-better-auth'
import type { Auth } from '../../../lib/auth'

export type AccountSession = {
  id: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  // The session's updatedAt: Better Auth refreshes it while the session is used.
  lastActiveAt: Date
  expiresAt: Date
}

// Account actions of the platform admin, done by Better Auth. Tests use a fake.
export abstract class AuthAccounts {
  // Blocks sign-in and ends every session.
  abstract suspend(userId: string): Promise<void>
  abstract reactivate(userId: string): Promise<void>
  abstract revokeSessions(userId: string): Promise<void>
  // Ends one session of the user; false when the user has no such session.
  abstract revokeSession(userId: string, sessionId: string): Promise<boolean>
  // Active sessions, newest first.
  abstract listSessions(userId: string): Promise<AccountSession[]>
  // False when the user has no password account.
  abstract setPassword(userId: string, password: string): Promise<boolean>
}

// Makes the same writes as the admin plugin routes (ban-user, unban-user,
// revoke-user-sessions, set-user-password) through Better Auth's internal
// adapter. Those routes need the admin's own request headers; going through
// the adapter keeps HTTP out of the use-cases, and the routes stay off.
@Injectable()
export class BetterAuthAccounts extends AuthAccounts {
  constructor(private readonly auth: AuthService<Auth>) {
    super()
  }

  async suspend(userId: string): Promise<void> {
    const { internalAdapter } = await this.context()
    await internalAdapter.updateUser(userId, { banned: true, banReason: null, banExpires: null, updatedAt: new Date() })
    await internalAdapter.deleteUserSessions(userId)
  }

  async reactivate(userId: string): Promise<void> {
    const { internalAdapter } = await this.context()
    await internalAdapter.updateUser(userId, {
      banned: false,
      banReason: null,
      banExpires: null,
      updatedAt: new Date(),
    })
  }

  async revokeSessions(userId: string): Promise<void> {
    await (await this.context()).internalAdapter.deleteUserSessions(userId)
  }

  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const { internalAdapter } = await this.context()
    const sessions = await internalAdapter.listSessions(userId, { onlyActiveSessions: true })
    const session = sessions.find(({ id }) => id === sessionId)
    if (!session) return false
    await internalAdapter.deleteSession(session.token)
    return true
  }

  async listSessions(userId: string): Promise<AccountSession[]> {
    const sessions = await (await this.context()).internalAdapter.listSessions(userId, { onlyActiveSessions: true })
    return sessions

      .map(({ id, ipAddress, userAgent, createdAt, updatedAt, expiresAt }) => ({
        id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        createdAt,
        lastActiveAt: updatedAt,
        expiresAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async setPassword(userId: string, password: string): Promise<boolean> {
    const { internalAdapter, password: hasher } = await this.context()
    if (!(await internalAdapter.findCredentialAccount(userId))) return false
    await internalAdapter.updatePassword(userId, await hasher.hash(password))
    return true
  }

  private context() {
    return this.auth.instance.$context
  }
}

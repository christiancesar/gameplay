import { Injectable } from '@nestjs/common'
import { AuthService } from '@thallesp/nestjs-better-auth'
import type { Auth } from '../../../../../lib/auth'
import { AccountSession, AuthAccounts } from '../auth-accounts.provider'

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

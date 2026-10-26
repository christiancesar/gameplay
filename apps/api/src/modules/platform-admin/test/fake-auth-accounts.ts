import { type AccountSession, AuthAccounts } from '../providers/auth-accounts'

// Account state in memory: who is suspended, their sessions and passwords.
export class FakeAuthAccounts extends AuthAccounts {
  readonly suspended = new Set<string>()
  readonly sessions = new Map<string, AccountSession[]>()
  readonly passwords = new Map<string, string>()

  async suspend(userId: string) {
    this.suspended.add(userId)
    this.sessions.delete(userId)
  }

  async reactivate(userId: string) {
    this.suspended.delete(userId)
  }

  async revokeSessions(userId: string) {
    this.sessions.delete(userId)
  }

  async revokeSession(userId: string, sessionId: string) {
    const sessions = this.sessions.get(userId) ?? []
    if (!sessions.some(({ id }) => id === sessionId)) return false
    this.sessions.set(
      userId,
      sessions.filter(({ id }) => id !== sessionId),
    )
    return true
  }

  async listSessions(userId: string) {
    return this.sessions.get(userId) ?? []
  }

  async setPassword(userId: string, password: string) {
    if (!this.passwords.has(userId)) return false
    this.passwords.set(userId, password)
    return true
  }
}

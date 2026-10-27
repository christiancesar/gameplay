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

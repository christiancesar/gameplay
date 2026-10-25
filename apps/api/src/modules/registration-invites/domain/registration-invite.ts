import type { RegistrationInviteStatus } from '@gameplay/shared'

export type RegistrationInviteRecord = {
  id: string
  keySuffix: string
  createdAt: Date
  expiresAt: Date
  revokedAt: Date | null
  usedAt: Date | null
  createdById: string
  usedBy: { id: string; username: string } | null
}

// A key taken by a sign-up counts as used even before the account is linked.
export function registrationInviteStatus(invite: RegistrationInviteRecord, now: Date): RegistrationInviteStatus {
  if (invite.usedAt) return 'used'
  if (invite.revokedAt) return 'revoked'
  if (invite.expiresAt <= now) return 'expired'
  return 'active'
}

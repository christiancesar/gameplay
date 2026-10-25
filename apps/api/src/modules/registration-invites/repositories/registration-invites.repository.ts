import type { RegistrationInviteRecord } from '../domain/registration-invite'

export type CreateRegistrationInviteData = {
  keyHmac: string
  keySuffix: string
  expiresAt: Date
  createdById: string
}

export abstract class RegistrationInvitesRepository {
  abstract create(data: CreateRegistrationInviteData): Promise<RegistrationInviteRecord>
  // Newest first.
  abstract list(): Promise<RegistrationInviteRecord[]>
  abstract findById(id: string): Promise<RegistrationInviteRecord | null>
  // Revokes a key that was not used yet. Returns false when nothing changed.
  abstract revoke(id: string, now: Date): Promise<boolean>
  // Marks an active key as used, atomically: of two sign-ups with the same
  // key, only one gets true.
  abstract take(keyHmac: string, now: Date): Promise<boolean>
  // Links the new account to a key taken by take().
  abstract assignUser(keyHmac: string, userId: string): Promise<void>
  // Gives back a key taken by a sign-up that failed.
  abstract release(keyHmac: string): Promise<void>
}

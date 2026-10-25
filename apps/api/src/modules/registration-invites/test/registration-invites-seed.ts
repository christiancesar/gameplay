import type { CreateRegistrationInviteData } from '../repositories/registration-invites.repository'

// The key the registration-invite tests sign up with, as FakeTokenHasher
// stores it.
export const SEED_KEY = 'ABC234'

// An active invite for SEED_KEY, created by "admin", valid for one more
// minute from `now`.
export function seedInvite(now = new Date()): CreateRegistrationInviteData {
  return {
    keyHmac: `hmac:${SEED_KEY}`,
    keySuffix: SEED_KEY.slice(-3),
    expiresAt: new Date(now.getTime() + 60_000),
    createdById: 'admin',
  }
}

import type { CreateRegistrationInviteData } from '../repositories/registration-invites.repository'
import { InMemoryRegistrationInvitesRepository } from '../repositories/in-memory/in-memory-registration-invites.repository'
import { ConsumeRegistrationInviteUseCase } from '../use-cases/consume-registration-invite.use-case'
import { GenerateRegistrationInviteUseCase } from '../use-cases/generate-registration-invite.use-case'
import { RevokeRegistrationInviteUseCase } from '../use-cases/revoke-registration-invite.use-case'
import { SettleRegistrationInviteUseCase } from '../use-cases/settle-registration-invite.use-case'
import { FakeTokenGenerator } from './fake-token-generator'
import { FakeTokenHasher } from './fake-token-hasher'
import { GENERATED_KEY, seedInvite } from './registration-invites-seed'

// Every registration-invite use-case wired to in-memory fakes, with no invite.
export function makeRegistrationInvitesContext() {
  const invites = new InMemoryRegistrationInvitesRepository()
  const hasher = new FakeTokenHasher()
  return {
    invites,
    hasher,
    generate: new GenerateRegistrationInviteUseCase(invites, new FakeTokenGenerator([GENERATED_KEY]), hasher),
    consume: new ConsumeRegistrationInviteUseCase(invites, hasher),
    settle: new SettleRegistrationInviteUseCase(invites, hasher),
    revoke: new RevokeRegistrationInviteUseCase(invites),
  }
}

// The same, with the seed invite stored (changes in `overrides`).
export async function makeRegistrationInvitesContextWithInvite(
  overrides: Partial<CreateRegistrationInviteData> = {},
  now = new Date(),
) {
  const ctx = makeRegistrationInvitesContext()
  const invite = await ctx.invites.create({ ...seedInvite(now), ...overrides })
  return { ...ctx, invite }
}

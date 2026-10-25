import { InvalidRegistrationKeyError } from '../errors/registration-invite.errors'
import { InMemoryRegistrationInvitesRepository } from '../repositories/in-memory/in-memory-registration-invites.repository'
import { FakeTokenHasher } from '../test/fake-token-hasher'
import { SEED_KEY, seedInvite } from '../test/registration-invites-seed'
import { ConsumeRegistrationInviteUseCase } from './consume-registration-invite.use-case'
import { SettleRegistrationInviteUseCase } from './settle-registration-invite.use-case'

describe('ConsumeRegistrationInviteUseCase and SettleRegistrationInviteUseCase', () => {
  const now = new Date('2026-10-24T12:00:00Z')

  beforeEach(() => vi.useFakeTimers({ now }))
  afterEach(() => vi.useRealTimers())

  async function makeSut(overrides: { expiresAt?: Date } = {}) {
    const invites = new InMemoryRegistrationInvitesRepository()
    const invite = await invites.create({ ...seedInvite(now), ...overrides })
    const hasher = new FakeTokenHasher()
    return {
      consume: new ConsumeRegistrationInviteUseCase(invites, hasher),
      settle: new SettleRegistrationInviteUseCase(invites, hasher),
      invites,
      invite,
    }
  }

  it('takes an active key, ignoring case and spaces', async () => {
    const { consume, invites } = await makeSut()

    await consume.execute(' abc234 ')

    expect(invites.items[0]?.usedAt).toEqual(now)
  })

  it('links the new account to the key', async () => {
    const { consume, settle, invites } = await makeSut()
    invites.usernames.set('user-1', 'ana_01')

    await consume.execute(SEED_KEY)
    await settle.execute({ key: SEED_KEY, userId: 'user-1' })

    expect((await invites.list())[0]?.usedBy).toEqual({ id: 'user-1', username: 'ana_01' })
  })

  it('gives the key back when the sign-up failed', async () => {
    const { consume, settle } = await makeSut()

    await consume.execute(SEED_KEY)
    await settle.execute({ key: SEED_KEY, userId: null })

    await expect(consume.execute(SEED_KEY)).resolves.toBeUndefined()
  })

  it('refuses a key that was used', async () => {
    const { consume, settle } = await makeSut()
    await consume.execute(SEED_KEY)
    await settle.execute({ key: SEED_KEY, userId: 'user-1' })

    await expect(consume.execute(SEED_KEY)).rejects.toThrow(InvalidRegistrationKeyError)
  })

  it('lets only one of two concurrent sign-ups take the key', async () => {
    const { consume } = await makeSut()

    const results = await Promise.allSettled([consume.execute(SEED_KEY), consume.execute(SEED_KEY)])

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected'])
  })

  it('refuses an expired key', async () => {
    const { consume } = await makeSut({ expiresAt: now })

    await expect(consume.execute(SEED_KEY)).rejects.toThrow(InvalidRegistrationKeyError)
  })

  it('refuses a revoked key', async () => {
    const { consume, invites, invite } = await makeSut()
    await invites.revoke(invite.id, now)

    await expect(consume.execute(SEED_KEY)).rejects.toThrow(InvalidRegistrationKeyError)
  })

  it('refuses an unknown key', async () => {
    const { consume } = await makeSut()

    await expect(consume.execute('ZZZ999')).rejects.toThrow(InvalidRegistrationKeyError)
  })
})

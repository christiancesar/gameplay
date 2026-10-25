import { InvalidRegistrationKeyError } from '../errors/registration-invite.errors'
import { makeRegistrationInvitesContextWithInvite } from '../test/registration-invites-context'
import { SEED_KEY } from '../test/registration-invites-seed'

describe('ConsumeRegistrationInviteUseCase and SettleRegistrationInviteUseCase', () => {
  const now = new Date('2026-10-24T12:00:00Z')

  beforeEach(() => vi.useFakeTimers({ now }))
  afterEach(() => vi.useRealTimers())

  it('takes an active key, ignoring case and spaces', async () => {
    const { consume, invites } = await makeRegistrationInvitesContextWithInvite({}, now)

    await consume.execute(' abc234 ')

    expect(invites.items[0]?.usedAt).toEqual(now)
  })

  it('links the new account to the key', async () => {
    const { consume, settle, invites } = await makeRegistrationInvitesContextWithInvite({}, now)
    invites.usernames.set('user-1', 'ana_01')

    await consume.execute(SEED_KEY)
    await settle.execute({ key: SEED_KEY, userId: 'user-1' })

    expect((await invites.list())[0]?.usedBy).toEqual({ id: 'user-1', username: 'ana_01' })
  })

  it('gives the key back when the sign-up failed', async () => {
    const { consume, settle } = await makeRegistrationInvitesContextWithInvite({}, now)

    await consume.execute(SEED_KEY)
    await settle.execute({ key: SEED_KEY, userId: null })

    await expect(consume.execute(SEED_KEY)).resolves.toBeUndefined()
  })

  it('refuses a key that was used', async () => {
    const { consume, settle } = await makeRegistrationInvitesContextWithInvite({}, now)
    await consume.execute(SEED_KEY)
    await settle.execute({ key: SEED_KEY, userId: 'user-1' })

    await expect(consume.execute(SEED_KEY)).rejects.toThrow(InvalidRegistrationKeyError)
  })

  it('lets only one of two concurrent sign-ups take the key', async () => {
    const { consume } = await makeRegistrationInvitesContextWithInvite({}, now)

    const results = await Promise.allSettled([consume.execute(SEED_KEY), consume.execute(SEED_KEY)])

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected'])
  })

  it('refuses an expired key', async () => {
    const { consume } = await makeRegistrationInvitesContextWithInvite({ expiresAt: now }, now)

    await expect(consume.execute(SEED_KEY)).rejects.toThrow(InvalidRegistrationKeyError)
  })

  it('refuses a revoked key', async () => {
    const { consume, invites, invite } = await makeRegistrationInvitesContextWithInvite({}, now)
    await invites.revoke(invite.id, now)

    await expect(consume.execute(SEED_KEY)).rejects.toThrow(InvalidRegistrationKeyError)
  })

  it('refuses an unknown key', async () => {
    const { consume } = await makeRegistrationInvitesContextWithInvite({}, now)

    await expect(consume.execute('ZZZ999')).rejects.toThrow(InvalidRegistrationKeyError)
  })
})

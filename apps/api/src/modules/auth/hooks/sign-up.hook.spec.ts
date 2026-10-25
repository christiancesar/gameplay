import type { AuthHookContext } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'
import { InMemoryRegistrationInvitesRepository } from '../../registration-invites/repositories/in-memory/in-memory-registration-invites.repository'
import { FakeTokenHasher } from '../../registration-invites/test/fake-token-hasher'
import { SEED_KEY, seedInvite } from '../../registration-invites/test/registration-invites-seed'
import { ConsumeRegistrationInviteUseCase } from '../../registration-invites/use-cases/consume-registration-invite.use-case'
import { SettleRegistrationInviteUseCase } from '../../registration-invites/use-cases/settle-registration-invite.use-case'
import { makeMembershipsContext } from '../../memberships/test/memberships-context'
import { SignUpHook } from './sign-up.hook'

function contextWith(body: Record<string, unknown>, newUserId?: string) {
  const newSession = newUserId ? { user: { id: newUserId } } : null
  return { body, context: { newSession } } as unknown as AuthHookContext
}

describe('SignUpHook', () => {
  async function makeSut() {
    const invites = new InMemoryRegistrationInvitesRepository()
    await invites.create(seedInvite())
    const hasher = new FakeTokenHasher()
    const servers = await makeMembershipsContext()
    const hook = new SignUpHook(
      new ConsumeRegistrationInviteUseCase(invites, hasher),
      new SettleRegistrationInviteUseCase(invites, hasher),
      servers.join,
      servers.resolve,
      servers.events,
    )
    return { hook, invites, servers }
  }

  it('uses the username as the display name and takes the key', async () => {
    const { hook, invites } = await makeSut()
    const ctx = contextWith({ username: 'ana_01', registrationKey: 'abc234' })

    await hook.before(ctx)

    expect(ctx.body.name).toBe('ana_01')
    expect(invites.items[0]?.usedAt).toBeInstanceOf(Date)
  })

  it.each([
    ['missing key', { username: 'ana_01' }],
    ['key with an ambiguous character', { username: 'ana_01', registrationKey: 'ABC10O' }],
    ['invalid username', { username: 'a', registrationKey: SEED_KEY }],
    ['unknown key', { username: 'ana_01', registrationKey: 'ZZZ999' }],
  ])('refuses a %s', async (_case, body) => {
    const { hook } = await makeSut()

    await expect(hook.before(contextWith(body))).rejects.toThrow(APIError)
  })

  it('links the key to the new account', async () => {
    const { hook, invites } = await makeSut()
    const body = { username: 'ana_01', registrationKey: SEED_KEY }
    await hook.before(contextWith(body))

    await hook.after(contextWith(body, 'user-1'))

    expect(invites.items[0]?.usedById).toBe('user-1')
  })

  it('gives the key back when the account was not created', async () => {
    const { hook, invites } = await makeSut()
    const body = { username: 'ana_01', registrationKey: SEED_KEY }
    await hook.before(contextWith(body))

    await hook.after(contextWith(body))

    expect(invites.items[0]?.usedAt).toBeNull()
  })

  describe('with a server invite', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    async function signUpWithInvite() {
      const sut = await makeSut()
      const { code } = await sut.servers.createInvite.execute({ serverId: sut.servers.serverId, userId: 'owner' })
      const body = { username: 'ana_01', registrationKey: SEED_KEY, serverInviteCode: code.toLowerCase() }
      await sut.hook.before(contextWith(body))
      return { ...sut, body }
    }

    it('creates the join request for the new account', async () => {
      const { hook, body, servers } = await signUpWithInvite()

      await hook.after(contextWith(body, 'user-1'))

      expect(servers.memberships.requests).toEqual([
        expect.objectContaining({ userId: 'user-1', serverId: servers.serverId, status: 'pending' }),
      ])
    })

    it('turns an invite that expired meanwhile into a notice, keeping the account', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z') })
      const { hook, body, servers } = await signUpWithInvite()
      vi.setSystemTime(new Date('2026-10-24T13:30:00Z'))

      await hook.after(contextWith(body, 'user-1'))

      expect(servers.memberships.requests).toEqual([])
      expect(servers.events.published).toEqual([
        {
          name: 'server-invite.expired-on-sign-up',
          payload: { userId: 'user-1', serverId: servers.serverId, serverName: 'Squad' },
        },
      ])
    })

    it('ignores the invite when the account was not created', async () => {
      const { hook, body, servers } = await signUpWithInvite()

      await hook.after(contextWith(body))

      expect(servers.memberships.requests).toEqual([])
    })

    it('ignores a code in the wrong format', async () => {
      const { hook, servers } = await makeSut()
      const body = { username: 'ana_01', registrationKey: SEED_KEY, serverInviteCode: 'nope' }
      await hook.before(contextWith(body))

      await expect(hook.after(contextWith(body, 'user-1'))).resolves.toBeUndefined()
      expect(servers.memberships.requests).toEqual([])
    })
  })
})

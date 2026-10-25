import { APIError } from 'better-auth/api'
import { SEED_KEY } from '../../registration-invites/test/registration-invites-seed'
import { fakeHookContext } from '../test/fake-hook-context'
import { makeSignUpHookContext } from '../test/sign-up-hook-context'

describe('SignUpHook', () => {
  it('uses the username as the display name and takes the key', async () => {
    const { hook, invites } = await makeSignUpHookContext()
    const ctx = fakeHookContext({ username: 'ana_01', registrationKey: 'abc234' })

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
    const { hook } = await makeSignUpHookContext()

    await expect(hook.before(fakeHookContext(body))).rejects.toThrow(APIError)
  })

  it('links the key to the new account', async () => {
    const { hook, invites } = await makeSignUpHookContext()
    const body = { username: 'ana_01', registrationKey: SEED_KEY }
    await hook.before(fakeHookContext(body))

    await hook.after(fakeHookContext(body, 'user-1'))

    expect(invites.items[0]?.usedById).toBe('user-1')
  })

  it('gives the key back when the account was not created', async () => {
    const { hook, invites } = await makeSignUpHookContext()
    const body = { username: 'ana_01', registrationKey: SEED_KEY }
    await hook.before(fakeHookContext(body))

    await hook.after(fakeHookContext(body))

    expect(invites.items[0]?.usedAt).toBeNull()
  })

  describe('with a server invite', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    async function signUpWithInvite() {
      const ctx = await makeSignUpHookContext()
      const { code } = await ctx.servers.createInvite.execute({ serverId: ctx.servers.serverId, userId: 'owner' })
      const body = { username: 'ana_01', registrationKey: SEED_KEY, serverInviteCode: code.toLowerCase() }
      await ctx.hook.before(fakeHookContext(body))
      return { ...ctx, body }
    }

    it('creates the join request for the new account', async () => {
      const { hook, body, servers } = await signUpWithInvite()

      await hook.after(fakeHookContext(body, 'user-1'))

      expect(servers.memberships.requests).toEqual([
        expect.objectContaining({ userId: 'user-1', serverId: servers.serverId, status: 'pending' }),
      ])
    })

    it('turns an invite that expired meanwhile into a notice, keeping the account', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z') })
      const { hook, body, servers } = await signUpWithInvite()
      vi.setSystemTime(new Date('2026-10-24T13:30:00Z'))

      await hook.after(fakeHookContext(body, 'user-1'))

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

      await hook.after(fakeHookContext(body))

      expect(servers.memberships.requests).toEqual([])
    })

    it('ignores a code in the wrong format', async () => {
      const { hook, servers } = await makeSignUpHookContext()
      const body = { username: 'ana_01', registrationKey: SEED_KEY, serverInviteCode: 'nope' }
      await hook.before(fakeHookContext(body))

      await expect(hook.after(fakeHookContext(body, 'user-1'))).resolves.toBeUndefined()
      expect(servers.memberships.requests).toEqual([])
    })
  })
})

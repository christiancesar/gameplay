import type { AuthHookContext } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'
import { InMemoryRegistrationInvitesRepository } from '../../registration-invites/repositories/in-memory/in-memory-registration-invites.repository'
import { FakeTokenHasher } from '../../registration-invites/test/fakes'
import { ConsumeRegistrationInviteUseCase } from '../../registration-invites/use-cases/consume-registration-invite.use-case'
import { SettleRegistrationInviteUseCase } from '../../registration-invites/use-cases/settle-registration-invite.use-case'
import { SignUpHook } from './sign-up.hook'

function contextWith(body: Record<string, unknown>, newUserId?: string) {
  const newSession = newUserId ? { user: { id: newUserId } } : null
  return { body, context: { newSession } } as unknown as AuthHookContext
}

describe('SignUpHook', () => {
  async function makeSut() {
    const invites = new InMemoryRegistrationInvitesRepository()
    await invites.create({
      keyHmac: 'hmac:ABC234',
      keySuffix: '234',
      expiresAt: new Date(Date.now() + 60_000),
      createdById: 'admin',
    })
    const hasher = new FakeTokenHasher()
    const hook = new SignUpHook(
      new ConsumeRegistrationInviteUseCase(invites, hasher),
      new SettleRegistrationInviteUseCase(invites, hasher),
    )
    return { hook, invites }
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
    ['invalid username', { username: 'a', registrationKey: 'ABC234' }],
    ['unknown key', { username: 'ana_01', registrationKey: 'ZZZ999' }],
  ])('refuses a %s', async (_case, body) => {
    const { hook } = await makeSut()

    await expect(hook.before(contextWith(body))).rejects.toThrow(APIError)
  })

  it('links the key to the new account', async () => {
    const { hook, invites } = await makeSut()
    const body = { username: 'ana_01', registrationKey: 'ABC234' }
    await hook.before(contextWith(body))

    await hook.after(contextWith(body, 'user-1'))

    expect(invites.items[0]?.usedById).toBe('user-1')
  })

  it('gives the key back when the account was not created', async () => {
    const { hook, invites } = await makeSut()
    const body = { username: 'ana_01', registrationKey: 'ABC234' }
    await hook.before(contextWith(body))

    await hook.after(contextWith(body))

    expect(invites.items[0]?.usedAt).toBeNull()
  })
})

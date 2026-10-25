import { CannotSuspendSelfError, UserNotFoundError } from '../errors/platform-admin.errors'
import { GENERATED_PASSWORD } from '../test/fixed-password-generator'
import { makePlatformAdminContext } from '../test/platform-admin-context'

describe('platform admin user actions', () => {
  it('lists users newest first, with search, pages and who is online', async () => {
    const { listUsers, presence } = makePlatformAdminContext()
    await presence.add('ana', 'tab-1')

    const all = await listUsers.execute({ page: 1, pageSize: 2 })
    expect(all.total).toBe(3)
    expect(all.items.map(({ id, online }) => [id, online])).toEqual([
      ['bia', false],
      ['ana', true],
    ])
    expect((await listUsers.execute({ search: 'ANA@', page: 1, pageSize: 20 })).items.map(({ id }) => id)).toEqual([
      'ana',
    ])
  })

  it('suspends a user, ending sessions, and reactivates them', async () => {
    const { suspend, reactivate, accounts, events } = makePlatformAdminContext()

    await suspend.execute({ adminId: 'admin', userId: 'ana' })
    expect(accounts.suspended.has('ana')).toBe(true)
    expect(accounts.sessions.has('ana')).toBe(false)
    expect(events.published).toEqual([{ name: 'user.suspended', payload: { userId: 'ana' } }])

    await reactivate.execute('ana')
    expect(accounts.suspended.has('ana')).toBe(false)
  })

  it('refuses to suspend oneself or someone who does not exist', async () => {
    const { suspend, events } = makePlatformAdminContext()

    await expect(suspend.execute({ adminId: 'admin', userId: 'admin' })).rejects.toBeInstanceOf(CannotSuspendSelfError)
    await expect(suspend.execute({ adminId: 'admin', userId: 'nobody' })).rejects.toBeInstanceOf(UserNotFoundError)
    expect(events.published).toEqual([])
  })

  it('lists and ends the sessions of a user', async () => {
    const { listSessions, revokeSessions, events } = makePlatformAdminContext()

    expect(await listSessions.execute('ana')).toEqual([expect.objectContaining({ ipAddress: '203.0.113.7' })])
    await revokeSessions.execute('ana')
    expect(await listSessions.execute('ana')).toEqual([])
    expect(events.published).toEqual([{ name: 'user.sessions-revoked', payload: { userId: 'ana' } }])
  })

  it('resets a password, typed or generated, and signs the user out', async () => {
    const { resetPassword, accounts, events } = makePlatformAdminContext()

    expect(await resetPassword.execute({ userId: 'ana', password: 'typed-by-admin' })).toEqual({
      password: 'typed-by-admin',
    })
    expect(accounts.passwords.get('ana')).toBe('typed-by-admin')
    expect(await resetPassword.execute({ userId: 'bia' })).toEqual({ password: GENERATED_PASSWORD })
    expect(accounts.passwords.get('bia')).toBe(GENERATED_PASSWORD)
    expect(accounts.sessions.has('ana')).toBe(false)
    expect(events.published.map(({ name }) => name)).toEqual(['user.sessions-revoked', 'user.sessions-revoked'])
  })
})

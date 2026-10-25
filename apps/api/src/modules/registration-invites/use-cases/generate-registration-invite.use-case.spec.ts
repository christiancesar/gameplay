import { makeRegistrationInvitesContext } from '../test/registration-invites-context'
import { GENERATED_KEY } from '../test/registration-invites-seed'

describe('GenerateRegistrationInviteUseCase', () => {
  const now = new Date('2026-10-24T12:00:00Z')

  beforeEach(() => vi.useFakeTimers({ now }))
  afterEach(() => vi.useRealTimers())

  it('returns the key once and stores only its HMAC and suffix', async () => {
    const { generate, invites } = makeRegistrationInvitesContext()

    const { key, invite } = await generate.execute({ validity: '7d', createdById: 'admin' })

    expect(key).toBe(GENERATED_KEY)
    expect(invite.keySuffix).toBe('X4P')
    expect(invites.items[0]).toMatchObject({ keyHmac: `hmac:${GENERATED_KEY}`, keySuffix: 'X4P', createdById: 'admin' })
  })

  it.each([
    ['1d', '2026-10-25T12:00:00.000Z'],
    ['7d', '2026-10-31T12:00:00.000Z'],
    ['30d', '2026-11-23T12:00:00.000Z'],
  ] as const)('expires %s later', async (validity, expiresAt) => {
    const { generate } = makeRegistrationInvitesContext()

    const { invite } = await generate.execute({ validity, createdById: 'admin' })

    expect(invite.expiresAt.toISOString()).toBe(expiresAt)
  })
})

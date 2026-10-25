import { InMemoryRegistrationInvitesRepository } from '../repositories/in-memory/in-memory-registration-invites.repository'
import { FakeTokenGenerator } from '../test/fake-token-generator'
import { FakeTokenHasher } from '../test/fake-token-hasher'
import { GenerateRegistrationInviteUseCase } from './generate-registration-invite.use-case'

describe('GenerateRegistrationInviteUseCase', () => {
  const now = new Date('2026-10-24T12:00:00Z')

  beforeEach(() => vi.useFakeTimers({ now }))
  afterEach(() => vi.useRealTimers())

  function makeSut() {
    const invites = new InMemoryRegistrationInvitesRepository()
    const sut = new GenerateRegistrationInviteUseCase(
      invites,
      new FakeTokenGenerator(['K7MX4P']),
      new FakeTokenHasher(),
    )
    return { sut, invites }
  }

  it('returns the key once and stores only its HMAC and suffix', async () => {
    const { sut, invites } = makeSut()

    const { key, invite } = await sut.execute({ validity: '7d', createdById: 'admin' })

    expect(key).toBe('K7MX4P')
    expect(invite.keySuffix).toBe('X4P')
    expect(invites.items[0]).toMatchObject({ keyHmac: 'hmac:K7MX4P', keySuffix: 'X4P', createdById: 'admin' })
  })

  it.each([
    ['1d', '2026-10-25T12:00:00.000Z'],
    ['7d', '2026-10-31T12:00:00.000Z'],
    ['30d', '2026-11-23T12:00:00.000Z'],
  ] as const)('expires %s later', async (validity, expiresAt) => {
    const { sut } = makeSut()

    const { invite } = await sut.execute({ validity, createdById: 'admin' })

    expect(invite.expiresAt.toISOString()).toBe(expiresAt)
  })
})

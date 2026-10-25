import {
  RegistrationInviteAlreadyUsedError,
  RegistrationInviteNotFoundError,
} from '../errors/registration-invite.errors'
import { InMemoryRegistrationInvitesRepository } from '../repositories/in-memory/in-memory-registration-invites.repository'
import { RevokeRegistrationInviteUseCase } from './revoke-registration-invite.use-case'

describe('RevokeRegistrationInviteUseCase', () => {
  async function makeSut() {
    const invites = new InMemoryRegistrationInvitesRepository()
    const invite = await invites.create({
      keyHmac: 'hmac:ABC234',
      keySuffix: '234',
      expiresAt: new Date(Date.now() + 60_000),
      createdById: 'admin',
    })
    return { sut: new RevokeRegistrationInviteUseCase(invites), invites, invite }
  }

  it('revokes an active key', async () => {
    const { sut, invites, invite } = await makeSut()

    await sut.execute(invite.id)

    expect(invites.items[0]?.revokedAt).toBeInstanceOf(Date)
  })

  it('accepts revoking twice', async () => {
    const { sut, invite } = await makeSut()
    await sut.execute(invite.id)

    await expect(sut.execute(invite.id)).resolves.toBeUndefined()
  })

  it('refuses a used key', async () => {
    const { sut, invites, invite } = await makeSut()
    await invites.take('hmac:ABC234', new Date())

    await expect(sut.execute(invite.id)).rejects.toThrow(RegistrationInviteAlreadyUsedError)
  })

  it('refuses an unknown key', async () => {
    const { sut } = await makeSut()

    await expect(sut.execute('missing')).rejects.toThrow(RegistrationInviteNotFoundError)
  })
})

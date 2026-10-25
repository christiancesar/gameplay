import {
  RegistrationInviteAlreadyUsedError,
  RegistrationInviteNotFoundError,
} from '../errors/registration-invite.errors'
import { seedInvite } from '../test/registration-invites-seed'
import { makeRegistrationInvitesContextWithInvite } from '../test/registration-invites-context'

describe('RevokeRegistrationInviteUseCase', () => {
  it('revokes an active key', async () => {
    const { revoke, invites, invite } = await makeRegistrationInvitesContextWithInvite()

    await revoke.execute(invite.id)

    expect(invites.items[0]?.revokedAt).toBeInstanceOf(Date)
  })

  it('accepts revoking twice', async () => {
    const { revoke, invite } = await makeRegistrationInvitesContextWithInvite()
    await revoke.execute(invite.id)

    await expect(revoke.execute(invite.id)).resolves.toBeUndefined()
  })

  it('refuses a used key', async () => {
    const { revoke, invites, invite } = await makeRegistrationInvitesContextWithInvite()
    await invites.take(seedInvite().keyHmac, new Date())

    await expect(revoke.execute(invite.id)).rejects.toThrow(RegistrationInviteAlreadyUsedError)
  })

  it('refuses an unknown key', async () => {
    const { revoke } = await makeRegistrationInvitesContextWithInvite()

    await expect(revoke.execute('missing')).rejects.toThrow(RegistrationInviteNotFoundError)
  })
})

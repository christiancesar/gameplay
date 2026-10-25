import { Injectable } from '@nestjs/common'
import {
  RegistrationInviteAlreadyUsedError,
  RegistrationInviteNotFoundError,
} from '../errors/registration-invite.errors'
import { RegistrationInvitesRepository } from '../repositories/registration-invites.repository'

// Revoking twice is fine; a used key can't be revoked.
@Injectable()
export class RevokeRegistrationInviteUseCase {
  constructor(private readonly invites: RegistrationInvitesRepository) {}

  async execute(id: string): Promise<void> {
    if (await this.invites.revoke(id, new Date())) return

    const invite = await this.invites.findById(id)
    if (!invite) throw new RegistrationInviteNotFoundError()
    if (invite.usedAt) throw new RegistrationInviteAlreadyUsedError()
  }
}

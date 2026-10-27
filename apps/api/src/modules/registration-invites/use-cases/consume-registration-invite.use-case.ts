import { Injectable } from '@nestjs/common'
import { InvalidRegistrationKeyError } from '../errors/registration-invite.errors'
import { TokenHasher } from '../providers/token-hasher/token-hasher.provider'
import { RegistrationInvitesRepository } from '../repositories/registration-invites.repository'

// First half of the sign-up: takes the key before the account is created.
// SettleRegistrationInvite then links the account, or gives the key back if
// the sign-up failed.
@Injectable()
export class ConsumeRegistrationInviteUseCase {
  constructor(
    private readonly invites: RegistrationInvitesRepository,
    private readonly hasher: TokenHasher,
  ) {}

  async execute(key: string): Promise<void> {
    const taken = await this.invites.take(this.hasher.hash(key.trim().toUpperCase()), new Date())
    if (!taken) throw new InvalidRegistrationKeyError()
  }
}

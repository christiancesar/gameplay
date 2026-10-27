import { Injectable } from '@nestjs/common'
import { TokenHasher } from '../providers/token-hasher/token-hasher.provider'
import { RegistrationInvitesRepository } from '../repositories/registration-invites.repository'

type Input = {
  key: string
  // The new account, or null when the sign-up failed after taking the key.
  userId: string | null
}

// Second half of the sign-up (see ConsumeRegistrationInvite).
@Injectable()
export class SettleRegistrationInviteUseCase {
  constructor(
    private readonly invites: RegistrationInvitesRepository,
    private readonly hasher: TokenHasher,
  ) {}

  async execute({ key, userId }: Input): Promise<void> {
    const keyHmac = this.hasher.hash(key.trim().toUpperCase())
    if (userId) await this.invites.assignUser(keyHmac, userId)
    else await this.invites.release(keyHmac)
  }
}

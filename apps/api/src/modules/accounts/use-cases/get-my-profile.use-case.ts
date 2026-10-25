import { Injectable } from '@nestjs/common'
import type { ProfileRecord } from '../domain/account'
import { AccountNotFoundError } from '../errors/accounts.errors'
import { ProfilesRepository } from '../repositories/profiles.repository'

@Injectable()
export class GetMyProfileUseCase {
  constructor(private readonly profiles: ProfilesRepository) {}

  async execute(userId: string): Promise<ProfileRecord> {
    const profile = await this.profiles.find(userId)
    if (!profile) throw new AccountNotFoundError()
    return profile
  }
}

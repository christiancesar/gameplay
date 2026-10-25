import { Injectable } from '@nestjs/common'
import type { Preferences, ProfileRecord } from '../domain/account'
import { ProfilesRepository } from '../repositories/profiles.repository'
import { GetMyProfileUseCase } from './get-my-profile.use-case'

type Input = { userId: string; preferences: Preferences }

// Theme and language, remembered per user.
@Injectable()
export class UpdateMyPreferencesUseCase {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly getProfile: GetMyProfileUseCase,
  ) {}

  async execute({ userId, preferences }: Input): Promise<ProfileRecord> {
    await this.getProfile.execute(userId)
    await this.profiles.updatePreferences(userId, preferences)
    return this.getProfile.execute(userId)
  }
}

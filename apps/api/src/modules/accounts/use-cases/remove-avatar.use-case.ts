import { Injectable } from '@nestjs/common'
import { StorageProvider } from '../../storage/storage.provider'
import { ProfilesRepository } from '../repositories/profiles.repository'
import { deleteQuietly } from './delete-quietly'
import { GetMyProfileUseCase } from './get-my-profile.use-case'

@Injectable()
export class RemoveAvatarUseCase {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly getProfile: GetMyProfileUseCase,
    private readonly storage: StorageProvider,
  ) {}

  async execute(userId: string): Promise<void> {
    const { avatarKey } = await this.getProfile.execute(userId)
    await this.profiles.setAvatar(userId, null)
    if (avatarKey) await deleteQuietly(this.storage, avatarKey)
  }
}

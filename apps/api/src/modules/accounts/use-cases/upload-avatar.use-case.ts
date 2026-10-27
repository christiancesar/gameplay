import { Injectable } from '@nestjs/common'
import { ImageProcessor, imageKey } from '../../storage/images/image-processor'
import { StorageProvider } from '../../storage/providers/storage/storage.provider'
import { ProfilesRepository } from '../repositories/profiles.repository'
import { deleteQuietly } from './delete-quietly'
import { GetMyProfileUseCase } from './get-my-profile.use-case'

type Input = { userId: string; file: Buffer }

// The only way to set the avatar: the public URL goes to user.image (read by
// the web from the session) and the key to avatarKey.
@Injectable()
export class UploadAvatarUseCase {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly getProfile: GetMyProfileUseCase,
    private readonly images: ImageProcessor,
    private readonly storage: StorageProvider,
  ) {}

  async execute({ userId, file }: Input): Promise<{ image: string }> {
    const { avatarKey: previousKey } = await this.getProfile.execute(userId)
    const processed = await this.images.process(file, 'square256')
    const key = imageKey('avatars', userId, processed.body)
    const image = this.storage.publicUrl(key)

    await this.storage.put(key, processed.body, processed.contentType)
    await this.profiles.setAvatar(userId, { image, key })
    // Same content gives the same key: nothing to delete then.
    if (previousKey && previousKey !== key) await deleteQuietly(this.storage, previousKey)
    return { image }
  }
}

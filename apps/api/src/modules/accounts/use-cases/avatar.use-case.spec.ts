import { Logger } from '@nestjs/common'
import sharp from 'sharp'
import { InMemoryStorageProvider } from '../../storage/drivers/in-memory-storage.provider'
import { UnsupportedImageError } from '../../storage/images/image.errors'
import { ImageProcessor } from '../../storage/images/image-processor'
import { AccountNotFoundError } from '../errors/accounts.errors'
import { InMemoryProfilesRepository } from '../repositories/in-memory/in-memory-profiles.repository'
import { GetMyProfileUseCase } from './get-my-profile.use-case'
import { RemoveAvatarUseCase } from './remove-avatar.use-case'
import { UploadAvatarUseCase } from './upload-avatar.use-case'

function png(color: string) {
  return sharp({ create: { width: 300, height: 200, channels: 3, background: color } })
    .png()
    .toBuffer()
}

describe('Avatar', () => {
  function makeSut() {
    const profiles = new InMemoryProfilesRepository()
    const storage = new InMemoryStorageProvider()
    const getProfile = new GetMyProfileUseCase(profiles)
    profiles.add({ id: 'u1' })
    return {
      profiles,
      storage,
      upload: new UploadAvatarUseCase(profiles, getProfile, new ImageProcessor(), storage),
      remove: new RemoveAvatarUseCase(profiles, getProfile, storage),
    }
  }

  it('stores the processed image and points the account at it', async () => {
    const { upload, profiles, storage } = makeSut()

    const { image } = await upload.execute({ userId: 'u1', file: await png('#ff0000') })

    const profile = profiles.profiles.get('u1')
    expect(image).toMatch(/^\/uploads\/avatars\/u1\/[0-9a-f]{16}\.webp$/)
    expect(profile?.image).toBe(image)
    expect(storage.files.get(profile?.avatarKey ?? '')?.contentType).toBe('image/webp')
  })

  it('deletes the previous file on change', async () => {
    const { upload, profiles, storage } = makeSut()
    await upload.execute({ userId: 'u1', file: await png('#ff0000') })
    const firstKey = profiles.profiles.get('u1')?.avatarKey ?? ''

    await upload.execute({ userId: 'u1', file: await png('#00ff00') })

    expect(storage.files.has(firstKey)).toBe(false)
    expect(storage.files.size).toBe(1)
  })

  it('keeps the file when the same image is sent again', async () => {
    const { upload, storage } = makeSut()
    const file = await png('#ff0000')
    await upload.execute({ userId: 'u1', file })

    await upload.execute({ userId: 'u1', file })

    expect(storage.files.size).toBe(1)
  })

  it('does not touch the account when the file is not an image', async () => {
    const { upload, profiles, storage } = makeSut()

    await expect(upload.execute({ userId: 'u1', file: Buffer.from('not an image') })).rejects.toThrow(
      UnsupportedImageError,
    )
    expect(profiles.profiles.get('u1')?.image).toBeNull()
    expect(storage.files.size).toBe(0)
  })

  it('removes the avatar and its file', async () => {
    const { upload, remove, profiles, storage } = makeSut()
    await upload.execute({ userId: 'u1', file: await png('#ff0000') })

    await remove.execute('u1')

    expect(profiles.profiles.get('u1')).toMatchObject({ image: null, avatarKey: null })
    expect(storage.files.size).toBe(0)
  })

  it('still answers when the old file cannot be deleted', async () => {
    const { upload, profiles, storage } = makeSut()
    await upload.execute({ userId: 'u1', file: await png('#ff0000') })
    storage.delete = () => Promise.reject(new Error('bucket down'))
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

    const { image } = await upload.execute({ userId: 'u1', file: await png('#0000ff') })

    expect(profiles.profiles.get('u1')?.image).toBe(image)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('refuses an unknown account', async () => {
    const { upload } = makeSut()

    await expect(upload.execute({ userId: 'missing', file: await png('#ff0000') })).rejects.toThrow(
      AccountNotFoundError,
    )
  })
})

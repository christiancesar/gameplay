import { Logger } from '@nestjs/common'
import { makeImage } from '../../storage/test/image-seed'
import { UnsupportedImageError } from '../../storage/images/image.errors'
import { AccountNotFoundError } from '../errors/accounts.errors'
import { makeAccountsContext } from '../test/accounts-context'

describe('Avatar', () => {
  it('stores the processed image and points the account at it', async () => {
    const { uploadAvatar, profiles, storage } = makeAccountsContext()

    const { image } = await uploadAvatar.execute({
      userId: 'u1',
      file: await makeImage({ color: '#ff0000' }),
    })

    const profile = profiles.profiles.get('u1')
    expect(image).toMatch(/^\/uploads\/avatars\/u1\/[0-9a-f]{16}\.webp$/)
    expect(profile?.image).toBe(image)
    expect(storage.files.get(profile?.avatarKey ?? '')?.contentType).toBe('image/webp')
  })

  it('deletes the previous file on change', async () => {
    const { uploadAvatar, profiles, storage } = makeAccountsContext()
    await uploadAvatar.execute({ userId: 'u1', file: await makeImage({ color: '#ff0000' }) })
    const firstKey = profiles.profiles.get('u1')?.avatarKey ?? ''

    await uploadAvatar.execute({ userId: 'u1', file: await makeImage({ color: '#00ff00' }) })

    expect(storage.files.has(firstKey)).toBe(false)
    expect(storage.files.size).toBe(1)
  })

  it('keeps the file when the same image is sent again', async () => {
    const { uploadAvatar, storage } = makeAccountsContext()
    const file = await makeImage({ color: '#ff0000' })
    await uploadAvatar.execute({ userId: 'u1', file })

    await uploadAvatar.execute({ userId: 'u1', file })

    expect(storage.files.size).toBe(1)
  })

  it('does not touch the account when the file is not an image', async () => {
    const { uploadAvatar, profiles, storage } = makeAccountsContext()

    await expect(uploadAvatar.execute({ userId: 'u1', file: Buffer.from('not an image') })).rejects.toThrow(
      UnsupportedImageError,
    )
    expect(profiles.profiles.get('u1')?.image).toBeNull()
    expect(storage.files.size).toBe(0)
  })

  it('removes the avatar and its file', async () => {
    const { uploadAvatar, removeAvatar, profiles, storage } = makeAccountsContext()
    await uploadAvatar.execute({ userId: 'u1', file: await makeImage({ color: '#ff0000' }) })

    await removeAvatar.execute('u1')

    expect(profiles.profiles.get('u1')).toMatchObject({ image: null, avatarKey: null })
    expect(storage.files.size).toBe(0)
  })

  it('still answers when the old file cannot be deleted', async () => {
    const { uploadAvatar, profiles, storage } = makeAccountsContext()
    await uploadAvatar.execute({ userId: 'u1', file: await makeImage({ color: '#ff0000' }) })
    storage.delete = () => Promise.reject(new Error('bucket down'))
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

    const { image } = await uploadAvatar.execute({
      userId: 'u1',
      file: await makeImage({ color: '#0000ff' }),
    })

    expect(profiles.profiles.get('u1')?.image).toBe(image)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('refuses an unknown account', async () => {
    const { uploadAvatar } = makeAccountsContext()

    await expect(
      uploadAvatar.execute({ userId: 'missing', file: await makeImage({ color: '#ff0000' }) }),
    ).rejects.toThrow(AccountNotFoundError)
  })
})

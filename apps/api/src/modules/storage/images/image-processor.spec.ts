import sharp from 'sharp'
import { makeImage } from '../test/image-seed'
import { IMAGE_MAX_BYTES, ImageProcessor, imageKey } from './image-processor'
import { ImageTooLargeError, UnsupportedImageError } from './image.errors'

describe('ImageProcessor', () => {
  const processor = new ImageProcessor()

  it.each(['jpeg', 'png', 'webp'] as const)('turns a %s into a 256 px WebP square', async (format) => {
    const result = await processor.process(await makeImage({ format: format }), 'square256')

    const meta = await sharp(result.body).metadata()
    expect(meta.format).toBe('webp')
    expect([meta.width, meta.height]).toEqual([256, 256])
    expect(result).toMatchObject({ contentType: 'image/webp', width: 256, height: 256 })
  })

  it('crops a cover to 1280x720', async () => {
    const result = await processor.process(
      await makeImage({ format: 'jpeg', width: 1000, height: 1000 }),
      'cover1280x720',
    )

    expect([result.width, result.height]).toEqual([1280, 720])
  })

  it('removes EXIF and applies the rotation it described', async () => {
    // 800x600 stored, with orientation 6 (rotate 90°) and a camera tag.
    const input = await sharp(await makeImage({ format: 'jpeg' }))
      .withExif({ IFD0: { Orientation: '6', Make: 'SecretCam' } })
      .jpeg()
      .toBuffer()
    expect((await sharp(input).metadata()).exif).toBeDefined()

    const result = await processor.process(input, 'cover1280x720')

    const meta = await sharp(result.body).metadata()
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation).toBeUndefined()
    expect(result.body.includes(Buffer.from('SecretCam'))).toBe(false)
  })

  it('refuses a file with an image extension that is not an image', async () => {
    await expect(processor.process(Buffer.from('%PDF-1.7 not an image'), 'square256')).rejects.toThrow(
      UnsupportedImageError,
    )
  })

  it('refuses a GIF', async () => {
    await expect(processor.process(await makeImage({ format: 'gif' as 'png' }), 'square256')).rejects.toThrow(
      UnsupportedImageError,
    )
  })

  it('refuses a corrupted image with valid magic bytes', async () => {
    const png = await makeImage({ format: 'png' })

    await expect(processor.process(png.subarray(0, 40), 'square256')).rejects.toThrow(UnsupportedImageError)
  })

  it('refuses more than 2 MB', async () => {
    const big = Buffer.concat([await makeImage({ format: 'png' }), Buffer.alloc(IMAGE_MAX_BYTES)])

    await expect(processor.process(big, 'square256')).rejects.toThrow(ImageTooLargeError)
  })
})

describe('imageKey', () => {
  it('changes with the content', () => {
    const a = imageKey('avatars', 'u1', Buffer.from('a'))

    expect(a).toMatch(/^avatars\/u1\/[0-9a-f]{16}\.webp$/)
    expect(imageKey('avatars', 'u1', Buffer.from('b'))).not.toBe(a)
  })
})

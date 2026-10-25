import { createHash } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import sharp from 'sharp'
import { ImageTooLargeError, UnsupportedImageError } from './image.errors'

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024

const PROFILES = {
  // Avatar and server icon.
  square256: { width: 256, height: 256 },
  // Server cover, 16:9.
  cover1280x720: { width: 1280, height: 720 },
} as const

export type ImageProfile = keyof typeof PROFILES

export type ProcessedImage = {
  body: Buffer
  contentType: 'image/webp'
  width: number
  height: number
}

type ImageType = 'jpeg' | 'png' | 'webp'

// Decoding stops above this many pixels (a small file can still expand into
// a huge image).
const MAX_INPUT_PIXELS = 50_000_000

@Injectable()
export class ImageProcessor {
  // Checks size and real type, then crops to the profile and re-encodes as
  // WebP. The output carries no metadata: sharp drops EXIF (location, camera)
  // unless asked to keep it, and autoOrient applies the rotation first.
  async process(input: Buffer, profile: ImageProfile): Promise<ProcessedImage> {
    if (input.length > IMAGE_MAX_BYTES) throw new ImageTooLargeError()
    if (!detectImageType(input)) throw new UnsupportedImageError()

    const { width, height } = PROFILES[profile]
    try {
      const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
        .autoOrient()
        .resize(width, height, { fit: 'cover' })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true })
      return { body: data, contentType: 'image/webp', width: info.width, height: info.height }
    } catch {
      throw new UnsupportedImageError()
    }
  }
}

// By the first bytes, not by the extension or the declared content type.
export function detectImageType(input: Buffer): ImageType | null {
  if (input.length >= 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) return 'jpeg'
  if (input.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (input.subarray(0, 4).toString('ascii') === 'RIFF' && input.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp'
  }
  return null
}

// Content-addressed key: a new image gets a new URL, so caches never serve
// the old one.
export function imageKey(folder: 'avatars' | 'icons' | 'covers', ownerId: string, body: Buffer): string {
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16)
  return `${folder}/${ownerId}/${hash}.webp`
}

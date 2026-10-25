import type { ImageError } from '@/shared/lib/image-error'

/** Same limits as the API (`IMAGE_MAX_BYTES` and the accepted formats). The API still checks the magic bytes. */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_MIME_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']

/** Returns why the file cannot be an avatar, or undefined when it can. Format is checked before size. */
function validateAvatarFile(
  file: Pick<File, 'type' | 'size'>,
): Extract<ImageError, 'tooLarge' | 'invalidType'> | undefined {
  if (!AVATAR_MIME_TYPES.includes(file.type)) return 'invalidType'
  if (file.size > AVATAR_MAX_BYTES) return 'tooLarge'
  return undefined
}

export { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, validateAvatarFile }

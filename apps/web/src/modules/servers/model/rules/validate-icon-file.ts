import type { ImageError } from '@/shared/ui/image-picker'

/** Same limits as the API (`IMAGE_MAX_BYTES` and the accepted formats). The API still checks the magic bytes. */
const ICON_MAX_BYTES = 2 * 1024 * 1024
const ICON_MIME_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']

/** Returns why the file cannot be an icon, or undefined when it can. Format is checked before size. */
function validateIconFile(
  file: Pick<File, 'type' | 'size'>,
): Extract<ImageError, 'tooLarge' | 'invalidType'> | undefined {
  if (!ICON_MIME_TYPES.includes(file.type)) return 'invalidType'
  if (file.size > ICON_MAX_BYTES) return 'tooLarge'
  return undefined
}

export { ICON_MAX_BYTES, ICON_MIME_TYPES, validateIconFile }

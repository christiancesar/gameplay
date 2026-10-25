import type { ImageError } from '@/shared/lib/image-error'

import { ApiError } from '@/shared/lib/api-error'

/** Maps a failed icon or cover upload to the error the image picker shows. */
function mapImageUploadError(error: unknown): ImageError {
  if (error instanceof ApiError) {
    if (error.code === 'IMAGE_TOO_LARGE') return 'tooLarge'
    if (error.code === 'UNSUPPORTED_IMAGE') return 'invalidType'
  }
  return 'uploadFailed'
}

export { mapImageUploadError }

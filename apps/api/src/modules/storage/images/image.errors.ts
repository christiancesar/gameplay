import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class ImageTooLargeError extends DomainError {
  readonly code = 'IMAGE_TOO_LARGE'
  override readonly status = HttpStatus.PAYLOAD_TOO_LARGE

  constructor() {
    super('The image must be at most 2 MB.')
  }
}

// Also for a file whose extension says image but whose content isn't one.
export class UnsupportedImageError extends DomainError {
  readonly code = 'UNSUPPORTED_IMAGE'
  override readonly status = HttpStatus.UNSUPPORTED_MEDIA_TYPE

  constructor() {
    super('Send a JPG, PNG or WebP image.')
  }
}

export class ImageRequiredError extends DomainError {
  readonly code = 'IMAGE_REQUIRED'
  override readonly status = HttpStatus.BAD_REQUEST

  constructor() {
    super('Send the image in the "file" field.')
  }
}

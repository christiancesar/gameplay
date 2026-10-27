import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class SfuNotConfiguredError extends DomainError {
  readonly code = 'SFU_NOT_CONFIGURED'
  override readonly status = HttpStatus.SERVICE_UNAVAILABLE

  constructor() {
    super('Screen share through the server is not available.')
  }
}

// The media server refused or did not answer in time.
export class SfuFailedError extends DomainError {
  readonly code = 'SFU_FAILED'
  override readonly status = HttpStatus.BAD_GATEWAY

  constructor() {
    super('The media server did not accept the request. Try again.')
  }
}

// Unknown, someone else's, or from a room the person is no longer in.
export class SfuSessionNotFoundError extends DomainError {
  readonly code = 'SFU_SESSION_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('That media session does not exist.')
  }
}

export class SfuTrackNotFoundError extends DomainError {
  readonly code = 'SFU_TRACK_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('That track is not in the media session.')
  }
}

export class SfuSessionLimitError extends DomainError {
  readonly code = 'SFU_SESSION_LIMIT'
  override readonly status = HttpStatus.TOO_MANY_REQUESTS

  constructor() {
    super('Too many media sessions open. Close one and try again.')
  }
}

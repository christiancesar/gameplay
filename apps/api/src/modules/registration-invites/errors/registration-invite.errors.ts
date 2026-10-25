import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class RegistrationInviteNotFoundError extends DomainError {
  readonly code = 'REGISTRATION_INVITE_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Registration key not found.')
  }
}

export class RegistrationInviteAlreadyUsedError extends DomainError {
  readonly code = 'REGISTRATION_INVITE_USED'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('This registration key was already used.')
  }
}

// Same error for a key that doesn't exist, expired, was revoked or used, so
// a sign-up attempt learns nothing about the key.
export class InvalidRegistrationKeyError extends DomainError {
  readonly code = 'INVALID_REGISTRATION_KEY'
  override readonly status = HttpStatus.BAD_REQUEST

  constructor() {
    super('The registration key is invalid or expired.')
  }
}

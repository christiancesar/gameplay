import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('User not found.')
  }
}

// The admin would lock themselves out of the panel.
export class CannotSuspendSelfError extends DomainError {
  readonly code = 'CANNOT_SUSPEND_SELF'
  override readonly status = HttpStatus.BAD_REQUEST

  constructor() {
    super('You cannot suspend your own account.')
  }
}

export class SessionNotFoundError extends DomainError {
  readonly code = 'SESSION_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Session not found.')
  }
}

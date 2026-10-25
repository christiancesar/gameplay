import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('User not found.')
  }
}

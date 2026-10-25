import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

// Also for another user's notification, so ids don't leak.
export class NotificationNotFoundError extends DomainError {
  readonly code = 'NOTIFICATION_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Notification not found.')
  }
}

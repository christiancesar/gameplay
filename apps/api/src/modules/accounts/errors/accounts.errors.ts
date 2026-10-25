import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class AccountNotFoundError extends DomainError {
  readonly code = 'ACCOUNT_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Account not found.')
  }
}

// Manual info goes on a device that already sent a collection.
export class DeviceNotFoundError extends DomainError {
  readonly code = 'DEVICE_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Device not found. Collect its hardware first.')
  }
}

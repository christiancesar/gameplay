import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

// Also for a server the user isn't a member of, so ids don't leak.
export class ServerNotFoundError extends DomainError {
  readonly code = 'SERVER_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Server not found.')
  }
}

export class ServerPermissionDeniedError extends DomainError {
  readonly code = 'SERVER_PERMISSION_DENIED'
  override readonly status = HttpStatus.FORBIDDEN

  constructor() {
    super('Your role in this server does not allow this action.')
  }
}

export class ServerLimitReachedError extends DomainError {
  readonly code = 'SERVER_LIMIT_REACHED'
  override readonly status = HttpStatus.CONFLICT

  constructor(readonly limit: number) {
    super(`You can create up to ${limit} server(s).`)
  }
}

export class RoomLimitReachedError extends DomainError {
  readonly code = 'ROOM_LIMIT_REACHED'
  override readonly status = HttpStatus.CONFLICT

  constructor(readonly limit: number) {
    super(`This server can have up to ${limit} room(s).`)
  }
}

export class RoomNotFoundError extends DomainError {
  readonly code = 'ROOM_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Room not found.')
  }
}

export class RoomNameTakenError extends DomainError {
  readonly code = 'ROOM_NAME_TAKEN'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('There is already a room with this name.')
  }
}

export class InvalidRoomOrderError extends DomainError {
  readonly code = 'INVALID_ROOM_ORDER'
  override readonly status = HttpStatus.BAD_REQUEST

  constructor() {
    super('Send every room of the server exactly once.')
  }
}

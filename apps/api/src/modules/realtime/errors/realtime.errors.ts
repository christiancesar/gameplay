import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

// The socket that sent the event does not hold a voice seat (never joined,
// or the person joined from another tab).
export class NotInRoomError extends DomainError {
  readonly code = 'NOT_IN_ROOM'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('Join a voice room first.')
  }
}

// The other person is not connected in the same voice room.
export class PeerNotInRoomError extends DomainError {
  readonly code = 'PEER_NOT_IN_ROOM'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('That person is not in your voice room.')
  }
}

export class NotStreamingError extends DomainError {
  readonly code = 'NOT_STREAMING'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('That person is not sharing their screen.')
  }
}

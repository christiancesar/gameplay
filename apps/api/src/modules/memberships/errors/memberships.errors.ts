import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class MemberLimitReachedError extends DomainError {
  readonly code = 'MEMBER_LIMIT_REACHED'
  override readonly status = HttpStatus.CONFLICT

  constructor(readonly limit: number) {
    super(`This server is full (${limit} members).`)
  }
}

export class ServerInviteNotFoundError extends DomainError {
  readonly code = 'SERVER_INVITE_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Invite not found.')
  }
}

export class ServerInviteExpiredError extends DomainError {
  readonly code = 'SERVER_INVITE_EXPIRED'
  override readonly status = HttpStatus.GONE

  constructor() {
    super('This invite has expired. Ask for a new one.')
  }
}

export class ServerInviteRevokedError extends DomainError {
  readonly code = 'SERVER_INVITE_REVOKED'
  override readonly status = HttpStatus.GONE

  constructor() {
    super('This invite was revoked.')
  }
}

export class ServerInviteUsedError extends DomainError {
  readonly code = 'SERVER_INVITE_USED'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('This invite was already used.')
  }
}

export class JoinRequestPendingError extends DomainError {
  readonly code = 'JOIN_REQUEST_PENDING'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('You already asked to join this server; wait for the approval.')
  }
}

export class JoinRequestNotFoundError extends DomainError {
  readonly code = 'JOIN_REQUEST_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Join request not found.')
  }
}

export class JoinRequestDecidedError extends DomainError {
  readonly code = 'JOIN_REQUEST_DECIDED'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('This join request was already decided.')
  }
}

export class MemberNotFoundError extends DomainError {
  readonly code = 'MEMBER_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Member not found.')
  }
}

// Kick, promote or demote yourself; leaving has its own route.
export class CannotTargetSelfError extends DomainError {
  readonly code = 'CANNOT_TARGET_SELF'
  override readonly status = HttpStatus.BAD_REQUEST

  constructor() {
    super('You cannot do this to yourself.')
  }
}

export class OwnerCannotLeaveError extends DomainError {
  readonly code = 'OWNER_CANNOT_LEAVE'
  override readonly status = HttpStatus.FORBIDDEN

  constructor() {
    super('The owner leaves only by deleting the server.')
  }
}

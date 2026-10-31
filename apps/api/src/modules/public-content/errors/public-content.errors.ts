import { HttpStatus } from '@nestjs/common'
import { DomainError } from '../../../common/errors/domain-error'

export class PublicContentNotFoundError extends DomainError {
  readonly code = 'PUBLIC_CONTENT_NOT_FOUND'
  override readonly status = HttpStatus.NOT_FOUND

  constructor() {
    super('Public content was not found.')
  }
}

export class FeatureVoteAlreadyExistsError extends DomainError {
  readonly code = 'FEATURE_VOTE_ALREADY_EXISTS'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('The user has already voted for this roadmap item.')
  }
}

export class PublicContentConflictError extends DomainError {
  readonly code = 'PUBLIC_CONTENT_CONFLICT'
  override readonly status = HttpStatus.CONFLICT

  constructor() {
    super('A public content item with the same slug already exists.')
  }
}

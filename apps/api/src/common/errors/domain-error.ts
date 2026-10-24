import { HttpStatus } from '@nestjs/common'

// Base class of the business errors thrown by use-cases. The global filter
// turns it into `{ error: { code, message } }` with the given HTTP status.
export abstract class DomainError extends Error {
  abstract readonly code: string
  readonly status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

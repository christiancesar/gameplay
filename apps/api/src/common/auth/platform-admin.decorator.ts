import {
  applyDecorators,
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
  UseGuards,
} from '@nestjs/common'
import { Roles } from '@thallesp/nestjs-better-auth'
import type { Request } from 'express'
import type { AuthUser } from '../../lib/auth'
import { DomainError } from '../errors/domain-error'

export class TwoFactorRequiredError extends DomainError {
  readonly code = 'TWO_FACTOR_REQUIRED'
  override readonly status = HttpStatus.FORBIDDEN

  constructor() {
    super('Set up two-factor authentication to use the admin panel.')
  }
}

@Injectable()
export class TwoFactorEnabledGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<Request & { user?: AuthUser }>()
    if (user?.twoFactorEnabled !== true) throw new TwoFactorRequiredError()
    return true
  }
}

// Platform admin routes: role "admin" and two-factor turned on, checked on
// every request.
export function PlatformAdmin() {
  return applyDecorators(Roles(['admin']), UseGuards(TwoFactorEnabledGuard))
}

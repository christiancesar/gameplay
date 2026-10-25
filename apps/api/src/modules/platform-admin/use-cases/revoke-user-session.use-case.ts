import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { SessionNotFoundError } from '../errors/platform-admin.errors'
import { AuthAccounts } from '../providers/auth-accounts'
import { AdminUsersService } from '../services/admin-users.service'

// Signs the user out of one device; the tabs of that session close too.
@Injectable()
export class RevokeUserSessionUseCase {
  constructor(
    private readonly users: AdminUsersService,
    private readonly accounts: AuthAccounts,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ userId, sessionId }: { userId: string; sessionId: string }): Promise<void> {
    await this.users.require(userId)
    if (!(await this.accounts.revokeSession(userId, sessionId))) throw new SessionNotFoundError()
    await this.events.publish('user.session-revoked', { userId, sessionId })
  }
}

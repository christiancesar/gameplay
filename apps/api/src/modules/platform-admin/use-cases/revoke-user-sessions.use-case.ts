import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { AuthAccounts } from '../providers/auth-accounts/auth-accounts.provider'
import { AdminUsersService } from '../services/admin-users.service'

// Signs the user out on every device; their open tabs close too.
@Injectable()
export class RevokeUserSessionsUseCase {
  constructor(
    private readonly users: AdminUsersService,
    private readonly accounts: AuthAccounts,
    private readonly events: DomainEventBus,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.users.require(userId)
    await this.accounts.revokeSessions(userId)
    await this.events.publish('user.sessions-revoked', { userId })
  }
}

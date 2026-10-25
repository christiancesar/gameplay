import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { CannotSuspendSelfError } from '../errors/platform-admin.errors'
import { AuthAccounts } from '../providers/auth-accounts'
import { AdminUsersService } from '../services/admin-users.service'

type Input = { adminId: string; userId: string }

// Blocks sign-in and ends sessions and connections at once. Suspending
// again does nothing new.
@Injectable()
export class SuspendUserUseCase {
  constructor(
    private readonly users: AdminUsersService,
    private readonly accounts: AuthAccounts,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ adminId, userId }: Input): Promise<void> {
    if (adminId === userId) throw new CannotSuspendSelfError()
    await this.users.require(userId)
    await this.accounts.suspend(userId)
    await this.events.publish('user.suspended', { userId })
  }
}

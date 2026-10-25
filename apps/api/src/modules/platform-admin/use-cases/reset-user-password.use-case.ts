import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { UserNotFoundError } from '../errors/platform-admin.errors'
import { AuthAccounts } from '../providers/auth-accounts'
import { PasswordGenerator } from '../providers/password-generator'
import { AdminUsersService } from '../services/admin-users.service'

type Input = { userId: string; password?: string }

// Sets the typed password, or a generated one, and returns it for the admin
// to pass on privately. The sessions end, so whoever had the old password is
// signed out.
@Injectable()
export class ResetUserPasswordUseCase {
  constructor(
    private readonly users: AdminUsersService,
    private readonly accounts: AuthAccounts,
    private readonly generator: PasswordGenerator,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ userId, password }: Input): Promise<{ password: string }> {
    await this.users.require(userId)
    const next = password ?? this.generator.generate()
    if (!(await this.accounts.setPassword(userId, next))) throw new UserNotFoundError()
    await this.accounts.revokeSessions(userId)
    await this.events.publish('user.sessions-revoked', { userId })
    return { password: next }
  }
}

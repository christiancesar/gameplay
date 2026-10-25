import { Injectable } from '@nestjs/common'
import { type AccountSession, AuthAccounts } from '../providers/auth-accounts'
import { AdminUsersService } from '../services/admin-users.service'

@Injectable()
export class ListUserSessionsUseCase {
  constructor(
    private readonly users: AdminUsersService,
    private readonly accounts: AuthAccounts,
  ) {}

  async execute(userId: string): Promise<AccountSession[]> {
    await this.users.require(userId)
    return this.accounts.listSessions(userId)
  }
}

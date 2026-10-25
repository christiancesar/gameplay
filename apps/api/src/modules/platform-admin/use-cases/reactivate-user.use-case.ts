import { Injectable } from '@nestjs/common'
import { AuthAccounts } from '../providers/auth-accounts'
import { AdminUsersService } from '../services/admin-users.service'

// The person can sign in again; nothing else changes.
@Injectable()
export class ReactivateUserUseCase {
  constructor(
    private readonly users: AdminUsersService,
    private readonly accounts: AuthAccounts,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.users.require(userId)
    await this.accounts.reactivate(userId)
  }
}

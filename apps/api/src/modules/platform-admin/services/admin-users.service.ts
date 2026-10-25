import { Injectable } from '@nestjs/common'
import type { AdminUserRecord } from '../domain/admin-records'
import { UserNotFoundError } from '../errors/platform-admin.errors'
import { AdminUsersRepository } from '../repositories/admin-users.repository'

// Shared by the user actions of the panel.
@Injectable()
export class AdminUsersService {
  constructor(private readonly users: AdminUsersRepository) {}

  async require(userId: string): Promise<AdminUserRecord> {
    const user = await this.users.findById(userId)
    if (!user) throw new UserNotFoundError()
    return user
  }
}

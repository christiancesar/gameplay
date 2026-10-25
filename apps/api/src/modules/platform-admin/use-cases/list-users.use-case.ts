import { Injectable } from '@nestjs/common'
import { PresenceStore } from '../../realtime/stores/presence.store'
import type { AdminUserRecord, Page, PageQuery } from '../domain/admin-records'
import { AdminUsersRepository } from '../repositories/admin-users.repository'

export type AdminUserListItem = AdminUserRecord & { online: boolean }

// With who is online right now (any tab connected).
@Injectable()
export class ListUsersUseCase {
  constructor(
    private readonly users: AdminUsersRepository,
    private readonly presence: PresenceStore,
  ) {}

  async execute(query: PageQuery): Promise<Page<AdminUserListItem>> {
    const { items, total } = await this.users.list(query)
    const online = new Set(await this.presence.onlineAmong(items.map(({ id }) => id)))
    return { items: items.map((user) => ({ ...user, online: online.has(user.id) })), total }
  }
}

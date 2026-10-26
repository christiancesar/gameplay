import { Injectable } from '@nestjs/common'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { PresenceStore } from '../../realtime/stores/presence.store'
import type { AdminUserRecord, Page, PageQuery } from '../domain/admin-records'
import { AdminUsersRepository } from '../repositories/admin-users.repository'

export type AdminUserListItem = AdminUserRecord & { online: boolean; effectiveMaxServers: number }

// With who is online right now (any tab connected) and the server limit in
// force for each one.
@Injectable()
export class ListUsersUseCase {
  constructor(
    private readonly users: AdminUsersRepository,
    private readonly presence: PresenceStore,
    private readonly limits: EffectiveLimitsService,
  ) {}

  async execute(query: PageQuery): Promise<Page<AdminUserListItem>> {
    const { items, total } = await this.users.list(query)
    const [online, defaults] = await Promise.all([
      this.presence.onlineAmong(items.map(({ id }) => id)).then((ids) => new Set(ids)),
      this.limits.defaults(),
    ])
    return {
      items: items.map((user) => ({
        ...user,
        online: online.has(user.id),
        effectiveMaxServers: user.maxServersOverride ?? defaults.maxServers,
      })),
      total,
    }
  }
}

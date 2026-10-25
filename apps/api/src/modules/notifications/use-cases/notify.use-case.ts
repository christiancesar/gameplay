import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import type { Notice } from '../domain/notices-for'
import { NotificationsRepository } from '../repositories/notifications.repository'

// Stores one notification per recipient and announces each, so the gateway
// can tell the person's tabs.
@Injectable()
export class NotifyUseCase {
  constructor(
    private readonly notifications: NotificationsRepository,
    private readonly servers: ServersRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ userIds, type, serverId, serverName }: Notice): Promise<void> {
    if (userIds.length === 0) return
    // A server deleted meanwhile has nothing left to notify about.
    const name = serverName ?? (await this.servers.findById(serverId))?.name
    if (name === undefined) return

    const created = await this.notifications.createMany(
      userIds.map((userId) => ({ userId, type, serverId, serverName: name })),
    )
    for (const { id, userId } of created) {
      await this.events.publish('notification.created', { userId, notificationId: id })
    }
  }
}

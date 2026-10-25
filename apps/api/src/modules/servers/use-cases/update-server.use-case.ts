import { Injectable } from '@nestjs/common'
import type { ServerDetail } from '@gameplay/shared'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { type ServerChanges, ServersRepository } from '../repositories/servers.repository'
import { ServerAccess } from '../services/server-access'
import { ServerViews } from '../services/server-views'

type Input = {
  serverId: string
  userId: string
  changes: Pick<ServerChanges, 'name' | 'description' | 'autoApprove'>
}

// Name, description and auto-approve (SetAutoApprove goes through here too).
@Injectable()
export class UpdateServerUseCase {
  constructor(
    private readonly servers: ServersRepository,
    private readonly access: ServerAccess,
    private readonly views: ServerViews,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, changes }: Input): Promise<ServerDetail> {
    const { role } = await this.access.require(serverId, userId, 'editServer')
    const server = await this.servers.update(serverId, changes)
    await this.events.publish('server.updated', { serverId })
    return this.views.detail(server, role)
  }
}

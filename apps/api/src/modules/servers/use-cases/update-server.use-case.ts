import { Injectable } from '@nestjs/common'
import type { ServerDetail } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { type ServerChanges, ServersRepository } from '../repositories/servers.repository'
import { ServerAccessService } from '../services/server-access.service'
import { ServerViewsService } from '../services/server-views.service'

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
    private readonly access: ServerAccessService,
    private readonly views: ServerViewsService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, changes }: Input): Promise<ServerDetail> {
    const { role } = await this.access.require(serverId, userId, 'editServer')
    const server = await this.servers.update(serverId, changes)
    await this.events.publish('server.updated', { serverId })
    return this.views.detail(server, role)
  }
}

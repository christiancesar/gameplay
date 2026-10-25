import { Injectable, Logger } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { StorageProvider } from '../../storage/storage.provider'
import { ServersRepository } from '../repositories/servers.repository'
import { ServerAccess } from '../services/server-access'

// Only the owner. Members and rooms go in cascade (invites and join requests
// too, once BE-10 adds them). The platform admin (BE-15) reuses deleteById.
@Injectable()
export class DeleteServerUseCase {
  private readonly logger = new Logger(DeleteServerUseCase.name)

  constructor(
    private readonly servers: ServersRepository,
    private readonly access: ServerAccess,
    private readonly storage: StorageProvider,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<void> {
    await this.access.require(serverId, userId, 'deleteServer')
    await this.deleteById(serverId)
  }

  // No permission check: for callers that already checked theirs.
  async deleteById(serverId: string): Promise<void> {
    const server = await this.servers.findById(serverId)
    if (!server) return
    const memberIds = await this.servers.listMemberIds(serverId)
    await this.servers.delete(serverId)

    for (const key of [server.iconKey, server.coverKey]) {
      if (key)
        await this.storage
          .delete(key)
          .catch((error: unknown) => this.logger.warn({ err: error, key }, 'Could not delete a server image'))
    }
    await this.events.publish('server.deleted', { serverId, memberIds })
  }
}

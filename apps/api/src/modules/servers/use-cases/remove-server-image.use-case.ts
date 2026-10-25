import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { StorageProvider } from '../../storage/storage.provider'
import { ServersRepository } from '../repositories/servers.repository'
import { ServerAccess } from '../services/server-access'
import { deletePreviousImage, SERVER_IMAGES, type ServerImageKind } from '../services/server-images'

type Input = { serverId: string; userId: string; kind: ServerImageKind }

@Injectable()
export class RemoveServerImageUseCase {
  constructor(
    private readonly servers: ServersRepository,
    private readonly access: ServerAccess,
    private readonly storage: StorageProvider,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, kind }: Input): Promise<void> {
    const { server } = await this.access.require(serverId, userId, 'editServer')
    await this.servers.update(serverId, { [SERVER_IMAGES[kind].field]: null })
    await deletePreviousImage(this.storage, server, kind, null)
    await this.events.publish('server.updated', { serverId })
  }
}

import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { StorageProvider } from '../../storage/providers/storage/storage.provider'
import { ServersRepository } from '../repositories/servers.repository'
import { ServerAccessService } from '../services/server-access.service'
import { SERVER_IMAGES, type ServerImageKind } from '../domain/server-images'
import { deletePreviousImage } from './delete-previous-image'

type Input = { serverId: string; userId: string; kind: ServerImageKind }

@Injectable()
export class RemoveServerImageUseCase {
  constructor(
    private readonly servers: ServersRepository,
    private readonly access: ServerAccessService,
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

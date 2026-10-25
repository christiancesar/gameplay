import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ImageProcessor, imageKey } from '../../storage/images/image-processor'
import { StorageProvider } from '../../storage/storage.provider'
import { ServersRepository } from '../repositories/servers.repository'
import { ServerAccessService } from '../services/server-access.service'
import { SERVER_IMAGES, type ServerImageKind } from '../domain/server-images'
import { deletePreviousImage } from './delete-previous-image'

type Input = { serverId: string; userId: string; kind: ServerImageKind; file: Buffer }

// Icon and cover share the flow; only the processing profile changes.
@Injectable()
export class UploadServerImageUseCase {
  constructor(
    private readonly servers: ServersRepository,
    private readonly access: ServerAccessService,
    private readonly images: ImageProcessor,
    private readonly storage: StorageProvider,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, kind, file }: Input): Promise<{ url: string }> {
    const { server } = await this.access.require(serverId, userId, 'editServer')
    const { profile, folder, field } = SERVER_IMAGES[kind]
    const processed = await this.images.process(file, profile)
    const key = imageKey(folder, serverId, processed.body)

    await this.storage.put(key, processed.body, processed.contentType)
    await this.servers.update(serverId, { [field]: key })
    await deletePreviousImage(this.storage, server, kind, key)
    await this.events.publish('server.updated', { serverId })
    return { url: this.storage.publicUrl(key) }
  }
}

import { Injectable } from '@nestjs/common'
import type { MediaChangeResponse, MediaNotice, ServerMediaOverrides } from '@gameplay/contracts'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { MediaChangeService } from '../services/media-change.service'

type Input = { serverId: string; overrides: ServerMediaOverrides; notice?: MediaNotice; sentById: string }

// One server's media resources, either way from the global settings.
@Injectable()
export class UpdateServerMediaUseCase {
  constructor(
    private readonly media: MediaSettingsRepository,
    private readonly change: MediaChangeService,
  ) {}

  async execute({ serverId, overrides, notice, sentById }: Input): Promise<MediaChangeResponse> {
    if (!(await this.media.findServer(serverId))) throw new ServerNotFoundError()
    return this.change.apply({
      serverId,
      write: async () => void (await this.media.setServer(serverId, overrides)),
      notice,
      sentById,
    })
  }
}

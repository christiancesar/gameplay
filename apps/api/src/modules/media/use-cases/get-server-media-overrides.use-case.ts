import { Injectable } from '@nestjs/common'
import type { ServerMediaOverrides } from '@gameplay/contracts'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { ServerNotFoundError } from '../../servers/errors/servers.errors'

// What the "Adjust server" dialog starts from.
@Injectable()
export class GetServerMediaOverridesUseCase {
  constructor(private readonly media: MediaSettingsRepository) {}

  async execute(serverId: string): Promise<ServerMediaOverrides> {
    const overrides = await this.media.findServer(serverId)
    if (!overrides) throw new ServerNotFoundError()
    return overrides
  }
}

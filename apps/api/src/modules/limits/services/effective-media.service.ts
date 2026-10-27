import { Injectable } from '@nestjs/common'
import type { MediaResource, MediaSettings } from '@gameplay/contracts'
import { resolveMedia } from '../domain/media'
import { MediaSettingsRepository } from '../repositories/media-settings.repository'

// The media resources in force for a server: its override, else the global
// setting. Read on every check, so a change applies right away.
@Injectable()
export class EffectiveMediaService {
  constructor(private readonly media: MediaSettingsRepository) {}

  async forServer(serverId: string): Promise<MediaSettings> {
    const [global, overrides] = await Promise.all([this.media.getGlobal(), this.media.findServer(serverId)])
    return resolveMedia(global, overrides)
  }

  async isOn(serverId: string, resource: MediaResource): Promise<boolean> {
    return (await this.forServer(serverId))[resource]
  }
}

import { Injectable } from '@nestjs/common'
import type { MediaChangeResponse, MediaNotice, MediaSettings } from '@gameplay/contracts'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { MediaChangeService } from '../services/media-change.service'

type Input = { settings: MediaSettings; notice?: MediaNotice; sentById: string }

// Global media settings. What goes off stops right away where no server
// overrides it.
@Injectable()
export class UpdateMediaSettingsUseCase {
  constructor(
    private readonly media: MediaSettingsRepository,
    private readonly change: MediaChangeService,
  ) {}

  execute({ settings, notice, sentById }: Input): Promise<MediaChangeResponse> {
    return this.change.apply({ serverId: null, write: () => this.media.setGlobal(settings), notice, sentById })
  }
}

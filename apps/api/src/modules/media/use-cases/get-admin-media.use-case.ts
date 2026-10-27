import { Injectable } from '@nestjs/common'
import type { AdminMediaResponse, MediaProviderStatus } from '@gameplay/contracts'
import { EnvService } from '../../../env/env.service'
import { IceHealthService } from '../../ice/services/ice-health.service'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { SfuProvider } from '../providers/sfu/sfu.provider'

// The Media tab: global settings, who delivers each resource and whether it
// works, and the servers that differ from the global settings.
@Injectable()
export class GetAdminMediaUseCase {
  constructor(
    private readonly media: MediaSettingsRepository,
    private readonly sfu: SfuProvider,
    private readonly iceHealth: IceHealthService,
    private readonly env: EnvService,
  ) {}

  async execute(): Promise<AdminMediaResponse> {
    const [settings, exceptions, turn] = await Promise.all([
      this.media.getGlobal(),
      this.media.listExceptions(),
      this.turnStatus(),
    ])
    const sfu: MediaProviderStatus = this.sfu.configured
      ? { name: this.sfu.name, state: 'ready' }
      : { name: null, state: 'not-configured' }
    return { settings, providers: { sfu, turn }, exceptions }
  }

  // The relay is checked by issuing credentials (cached a few minutes).
  private async turnStatus(): Promise<MediaProviderStatus> {
    const report = await this.iceHealth.check()
    if (!report) return { name: null, state: 'not-configured' }
    return { name: this.env.get('ICE_PROVIDER'), state: report.status === 'outage' ? 'failing' : 'ready' }
  }
}

import { Injectable } from '@nestjs/common'
import type { PlatformSettings } from '@gameplay/contracts'
import { PlatformSettingsRepository } from '../repositories/platform-settings.repository'

@Injectable()
export class GetPlatformSettingsUseCase {
  constructor(private readonly settings: PlatformSettingsRepository) {}

  execute(): Promise<PlatformSettings> {
    return this.settings.get()
  }
}

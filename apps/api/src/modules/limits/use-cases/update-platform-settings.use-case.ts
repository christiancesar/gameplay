import { Injectable } from '@nestjs/common'
import type { PlatformSettings } from '@gameplay/contracts'
import { PlatformSettingsRepository } from '../repositories/platform-settings.repository'

// Takes effect on the next check: limits are read from the database each time.
@Injectable()
export class UpdatePlatformSettingsUseCase {
  constructor(private readonly settings: PlatformSettingsRepository) {}

  execute(data: PlatformSettings): Promise<PlatformSettings> {
    return this.settings.update(data)
  }
}

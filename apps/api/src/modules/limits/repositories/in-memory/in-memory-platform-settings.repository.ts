import type { PlatformSettings } from '@gameplay/contracts'
import { PlatformSettingsRepository } from '../platform-settings.repository'

export class InMemoryPlatformSettingsRepository extends PlatformSettingsRepository {
  settings: PlatformSettings = {
    maxServersPerUser: 1,
    maxMembersPerServer: 10,
    maxRoomsPerServer: 2,
  }

  async get(): Promise<PlatformSettings> {
    return { ...this.settings }
  }

  async update(data: PlatformSettings): Promise<PlatformSettings> {
    this.settings = { ...data }
    return this.get()
  }
}

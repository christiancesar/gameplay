import type { PlatformSettings } from '@gameplay/contracts'

export abstract class PlatformSettingsRepository {
  abstract get(): Promise<PlatformSettings>
  abstract update(data: PlatformSettings): Promise<PlatformSettings>
}

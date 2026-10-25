import type { PlatformSettings } from '@gameplay/shared'

export abstract class PlatformSettingsRepository {
  abstract get(): Promise<PlatformSettings>
  abstract update(data: PlatformSettings): Promise<PlatformSettings>
}

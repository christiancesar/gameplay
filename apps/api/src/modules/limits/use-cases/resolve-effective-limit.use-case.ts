import { Injectable } from '@nestjs/common'
import { PlatformSettingsRepository } from '../repositories/platform-settings.repository'
import { UserLimitsRepository } from '../repositories/user-limits.repository'

// Per-server kinds (members, rooms) come with the Server model in BE-09.
type Input = { kind: 'serversPerUser'; userId: string }

// The override when there is one, else the global default.
@Injectable()
export class ResolveEffectiveLimitUseCase {
  constructor(
    private readonly settings: PlatformSettingsRepository,
    private readonly userLimits: UserLimitsRepository,
  ) {}

  async execute({ userId }: Input): Promise<number> {
    const [settings, userLimits] = await Promise.all([this.settings.get(), this.userLimits.find(userId)])
    return userLimits?.maxServers ?? settings.maxServersPerUser
  }
}

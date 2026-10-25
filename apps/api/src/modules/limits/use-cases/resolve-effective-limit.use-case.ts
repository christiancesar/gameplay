import { Injectable } from '@nestjs/common'
import { PlatformSettingsRepository } from '../repositories/platform-settings.repository'
import { ServerLimitsRepository } from '../repositories/server-limits.repository'
import { UserLimitsRepository } from '../repositories/user-limits.repository'

type Input =
  | { kind: 'serversPerUser'; userId: string }
  | { kind: 'membersPerServer'; serverId: string }
  | { kind: 'roomsPerServer'; serverId: string }

// The override when there is one, else the global default.
@Injectable()
export class ResolveEffectiveLimitUseCase {
  constructor(
    private readonly settings: PlatformSettingsRepository,
    private readonly userLimits: UserLimitsRepository,
    private readonly serverLimits: ServerLimitsRepository,
  ) {}

  async execute(input: Input): Promise<number> {
    if (input.kind === 'serversPerUser') {
      const [settings, overrides] = await Promise.all([this.settings.get(), this.userLimits.find(input.userId)])
      return overrides?.maxServers ?? settings.maxServersPerUser
    }
    const [settings, overrides] = await Promise.all([this.settings.get(), this.serverLimits.find(input.serverId)])
    return input.kind === 'membersPerServer'
      ? (overrides?.maxMembers ?? settings.maxMembersPerServer)
      : (overrides?.maxRooms ?? settings.maxRoomsPerServer)
  }
}

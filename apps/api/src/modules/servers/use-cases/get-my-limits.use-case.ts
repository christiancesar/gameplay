import { Injectable } from '@nestjs/common'
import type { MyLimits } from '@gameplay/contracts'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { ServersRepository } from '../repositories/servers.repository'

// How many servers the user may own (override or default) and how many they own.
@Injectable()
export class GetMyLimitsUseCase {
  constructor(
    private readonly servers: ServersRepository,
    private readonly limits: EffectiveLimitsService,
  ) {}

  async execute(userId: string): Promise<MyLimits> {
    const [maxServers, ownedServers] = await Promise.all([
      this.limits.resolve({ kind: 'serversPerUser', userId }),
      this.servers.countOwned(userId),
    ])
    return { maxServers, ownedServers }
  }
}

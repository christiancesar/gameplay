import type { ServerLimits } from '@gameplay/shared'
import { ServerLimitsRepository } from '../server-limits.repository'

export class InMemoryServerLimitsRepository extends ServerLimitsRepository {
  // serverId -> limits; a server exists when it's in the map.
  readonly servers = new Map<string, ServerLimits>()

  async find(serverId: string): Promise<ServerLimits | null> {
    return this.servers.get(serverId) ?? null
  }

  async set(serverId: string, limits: ServerLimits): Promise<boolean> {
    if (!this.servers.has(serverId)) return false
    this.servers.set(serverId, limits)
    return true
  }
}

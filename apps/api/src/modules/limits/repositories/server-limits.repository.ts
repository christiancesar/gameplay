import type { ServerLimits } from '@gameplay/contracts'

export abstract class ServerLimitsRepository {
  // null when the server doesn't exist.
  abstract find(serverId: string): Promise<ServerLimits | null>
  // Returns false when the server doesn't exist.
  abstract set(serverId: string, limits: ServerLimits): Promise<boolean>
}

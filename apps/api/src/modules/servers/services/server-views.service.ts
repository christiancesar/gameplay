import { Injectable } from '@nestjs/common'
import type { Room, ServerDetail, ServerRole, ServerSummary } from '@gameplay/contracts'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { StorageProvider } from '../../storage/providers/storage/storage.provider'
import type { RoomRecord, ServerRecord } from '../domain/server'
import { ServerPermissions } from '../domain/server-permissions'
import { RoomsRepository } from '../repositories/rooms.repository'
import { ServersRepository } from '../repositories/servers.repository'

export function toRoom({ id, name, position }: RoomRecord): Room {
  return { id, name, position }
}

// Builds what the routes answer: image URLs from the keys, member count,
// effective limits, rooms and, for who decides join requests, how many wait.
@Injectable()
export class ServerViewsService {
  constructor(
    private readonly servers: ServersRepository,
    private readonly rooms: RoomsRepository,
    private readonly limits: EffectiveLimitsService,
    private readonly storage: StorageProvider,
  ) {}

  summary(server: ServerRecord, role: ServerRole): ServerSummary {
    return { id: server.id, name: server.name, iconUrl: this.url(server.iconKey), role }
  }

  async detail(server: ServerRecord, role: ServerRole): Promise<ServerDetail> {
    const [memberCount, maxMembers, maxRooms, rooms, pendingJoinRequests] = await Promise.all([
      this.servers.countMembers(server.id),
      this.limits.resolve({ kind: 'membersPerServer', serverId: server.id }),
      this.limits.resolve({ kind: 'roomsPerServer', serverId: server.id }),
      this.rooms.list(server.id),
      // Only who can decide the requests sees how many wait.
      ServerPermissions.can(role, 'decideJoinRequests') ? this.servers.countPendingJoinRequests(server.id) : null,
    ])
    return {
      id: server.id,
      name: server.name,
      description: server.description,
      iconUrl: this.url(server.iconKey),
      coverUrl: this.url(server.coverKey),
      autoApprove: server.autoApprove,
      ownerId: server.ownerId,
      role,
      memberCount,
      limits: { maxMembers, maxRooms },
      rooms: rooms.map(toRoom),
      pendingJoinRequests,
    }
  }

  url(key: string | null): string | null {
    return key && this.storage.publicUrl(key)
  }
}

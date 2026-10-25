import { Injectable } from '@nestjs/common'
import type { PresenceSnapshot } from '@gameplay/contracts'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { occupancy } from '../domain/seat'
import { PresenceStore } from '../stores/presence.store'
import { RoomStateStore } from '../stores/room-state.store'

type Input = { serverId: string; userId: string }

// Only members follow a server. Returns who of them is online and who is in
// each voice room; the gateway puts the socket in the server room.
@Injectable()
export class SubscribeToServerUseCase {
  constructor(
    private readonly access: ServerAccessService,
    private readonly servers: ServersRepository,
    private readonly presence: PresenceStore,
    private readonly store: RoomStateStore,
  ) {}

  async execute({ serverId, userId }: Input): Promise<PresenceSnapshot> {
    await this.access.member(serverId, userId)
    const memberIds = await this.servers.listMemberIds(serverId)
    return {
      serverId,
      onlineUserIds: await this.presence.onlineAmong(memberIds),
      rooms: occupancy(await this.store.listServer(serverId)),
    }
  }
}

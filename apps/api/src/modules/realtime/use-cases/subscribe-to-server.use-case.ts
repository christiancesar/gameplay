import { Injectable } from '@nestjs/common'
import type { PresenceSnapshot } from '@gameplay/shared'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { PresenceStore } from '../stores/presence.store'

type Input = { serverId: string; userId: string }

// Only members follow a server. Returns who of them is online; the gateway
// puts the socket in the server room.
@Injectable()
export class SubscribeToServerUseCase {
  constructor(
    private readonly access: ServerAccessService,
    private readonly servers: ServersRepository,
    private readonly presence: PresenceStore,
  ) {}

  async execute({ serverId, userId }: Input): Promise<PresenceSnapshot> {
    await this.access.member(serverId, userId)
    const memberIds = await this.servers.listMemberIds(serverId)
    return { serverId, onlineUserIds: await this.presence.onlineAmong(memberIds) }
  }
}
